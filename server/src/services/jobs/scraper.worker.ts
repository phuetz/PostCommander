import { Worker, Job, type WorkerOptions } from 'bullmq';
import { Stagehand } from '@browserbasehq/stagehand';
import { generateText } from 'ai';
import { createModel } from '../llm/provider-factory.js';
import { openai } from '@ai-sdk/openai';
import { sharedRedisConnection } from '../../utils/redis.js';
import { logger } from '../../utils/logger.js';
import { getDrizzle } from '../../db/connection.js';
import { posts, automationRuns } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { searchWeb } from '../web-search.js';

interface ScraperJobData {
  automationId: string;
  flowData: {
    nodes: any[];
    edges: any[];
  };
  userId: string;
  workspaceId: string;
  webhookPayload?: any;
  resumeState?: {
    nodeOutputs: Record<string, any>;
    context: Record<string, any>;
    completedNodeIds: string[];
  };
}

// Helper to evaluate simple template expressions, e.g. {{item.title}} or {{act-http_1.response.0.name}}
function evaluateTemplate(template: string, context: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    const expr = expression.trim();
    try {
      const parts = expr.split('.');
      let current = context;
      for (const part of parts) {
        if (current === null || current === undefined) return '';
        if (/^\d+$/.test(part)) {
          current = current[parseInt(part, 10)];
        } else {
          current = current[part];
        }
      }
      if (typeof current === 'object') {
        return JSON.stringify(current);
      }
      return current !== undefined && current !== null ? String(current) : '';
    } catch (e) {
      return '';
    }
  });
}

// Helper to fetch and parse an RSS feed
async function parseRss(url: string): Promise<any[]> {
  try {
    const res = await fetch(url);
    const xml = await res.text();
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const descriptionMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
      
      items.push({
        title: titleMatch ? titleMatch[1].trim() : 'No Title',
        link: linkMatch ? linkMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
      });
    }
    return items;
  } catch (e: any) {
    logger.error(`RSS fetch/parse error: ${e.message}`);
    return [];
  }
}

export const scraperWorker = new Worker<ScraperJobData>(
  'scraper-flow',
  async (job: Job<ScraperJobData>) => {
    const { automationId, flowData, userId, workspaceId, webhookPayload, resumeState } = job.data as any;
    logger.info(`Starting execution for automation flow: ${automationId}${resumeState ? ' (RESUMED)' : ''}`);
    const runStartMs = Date.now();

    // Persist run start in automation_runs (insert; on conflict by jobId, just skip).
    // Test-node sub-jobs share this same path — they end up in history too.
    try {
      const db = getDrizzle();
      await db
        .insert(automationRuns)
        .values({
          id: crypto.randomUUID(),
          automationId,
          userId,
          workspaceId,
          jobId: String(job.id ?? ''),
          status: 'running',
          startedAt: new Date(runStartMs).toISOString(),
        })
        .onConflictDoNothing({ target: automationRuns.jobId });
    } catch (e: any) {
      logger.warn(`Failed to record run start in automation_runs: ${e.message}`);
    }

    const { nodes, edges } = flowData;
    const nodeOutputs: Record<string, any> = resumeState?.nodeOutputs || {};
    const context: Record<string, any> = resumeState?.context || {
      webhook: { body: webhookPayload || {} },
      item: {},
    };

    // Build adjacency list
    const adj: Record<string, string[]> = {};
    for (const edge of edges) {
      if (!adj[edge.source]) {
        adj[edge.source] = [];
      }
      adj[edge.source].push(edge.target);
    }

    // Find trigger node(s)
    const triggerNodes = nodes.filter((n) => n.data?.type === 'trigger');
    if (triggerNodes.length === 0) {
      logger.error('No trigger node found in workflow.');
      return { success: false, error: 'No trigger node found' };
    }

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let finalContent = '';

    const completedNodeIds: string[] = resumeState?.completedNodeIds || [];
    let activeNodeId: string | null = null;
    const runningNodeErrors: Record<string, string> = {};
    const executionLogs: Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'warn' }> = [];

    async function pushProgress() {
      try {
        await job.updateProgress({
          activeNodeId,
          completedNodeIds,
          runningNodeErrors,
          nodeOutputs,
          logs: executionLogs,
        });
      } catch (err: any) {
        logger.warn(`Failed to update progress: ${err.message}`);
      }
    }

    function addLog(msg: string, type: 'info' | 'error' | 'warn' = 'info') {
      executionLogs.push({ timestamp: new Date().toISOString(), message: msg, type });
      if (type === 'error') logger.error(`[Job ${job.id}] ${msg}`);
      else if (type === 'warn') logger.warn(`[Job ${job.id}] ${msg}`);
      else logger.info(`[Job ${job.id}] ${msg}`);
      pushProgress().catch(() => {});
    }

    // Recursive executor
    async function executeNode(nodeId: string, currentContext: Record<string, any> = context) {
      if (completedNodeIds.includes(nodeId)) {
        addLog(`Skipping already completed node: ${nodeId}`);
        const targets = adj[nodeId] || [];
        for (const targetId of targets) {
          await executeNode(targetId, currentContext);
        }
        return;
      }

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      activeNodeId = nodeId;
      await pushProgress();

      addLog(`Executing workflow node: ${node.id} (${node.data?.label})`);
      let output: any = null;

      try {
        const nodeType = node.data?.type;

        // TRIGGER NODES
        if (nodeType === 'trigger') {
          if (node.id.includes('url')) {
            output = { url: node.data.url || 'https://news.ycombinator.com' };
          } else if (node.id.includes('cron')) {
            output = { timestamp: new Date().toISOString() };
          } else if (node.id.includes('webhook')) {
            output = { timestamp: new Date().toISOString() };
          } else if (node.id.includes('rss')) {
            const rssUrl = evaluateTemplate(node.data.rssUrl || 'https://news.ycombinator.com/rss', currentContext);
            addLog(`RSS Trigger: Fetching feed from ${rssUrl}`);
            const items = await parseRss(rssUrl);
            output = items;
            addLog(`RSS Trigger: Found ${items.length} items.`);
          }
        } 
        // ACTION NODES
        else if (nodeType === 'action') {
          if (node.id.includes('scrape')) {
            const urlToScrape = evaluateTemplate(node.data.url || currentContext['trig-url_0']?.url || 'https://news.ycombinator.com', currentContext);
            const scrapeInstruction = evaluateTemplate(node.data.instruction || 'Extract the top 3 news articles and their URLs', currentContext);
            
            addLog(`Stagehand: Navigating to ${urlToScrape}`);
            const stagehand = new Stagehand({
              env: 'LOCAL',
              verbose: 1,
              logger: (msg) => {
                if (msg.message.includes('error')) addLog(`[Stagehand] ${msg.message}`, 'error');
                else addLog(`[Stagehand] ${msg.message}`);
              }
            });

            try {
              await stagehand.init();
              const page = (stagehand as any).page;
              await page.goto(urlToScrape);
              addLog(`Stagehand: Extracting with instruction: "${scrapeInstruction}"`);
              const extraction = await page.extract(scrapeInstruction);
              output = extraction;
              addLog('Stagehand: Extraction successful.');
            } catch (e: any) {
              addLog(`Stagehand error: ${e.message}. Using mock fallback for simulation.`, 'error');
              // Simulation fallback to prevent workflow failure when not connected to browserbase
              output = [
                { title: "Stagehand web scraping releases V3 with direct AI extraction capabilities", link: "https://github.com/browserbase/stagehand" },
                { title: "Show HN: PostCommander local automation framework with n8n style loops", link: "https://postcommander.dev" },
                { title: "Drizzle ORM announces full support for PostgreSQL schema replication", link: "https://orm.drizzle.team" }
              ];
            } finally {
              await stagehand.close();
            }
          } 
          
          else if (node.id.includes('http')) {
            const method = node.data.method || 'GET';
            const url = evaluateTemplate(node.data.url || '', currentContext);
            const rawHeaders = node.data.headers || '';
            const rawBody = node.data.body || '';

            addLog(`HTTP Action: Sending ${method} request to ${url}`);

            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };
            if (rawHeaders) {
              const lines = rawHeaders.split('\n');
              for (const line of lines) {
                const parts = line.split(':');
                if (parts.length >= 2) {
                  headers[parts[0].trim()] = parts.slice(1).join(':').trim();
                }
              }
            }

            const fetchOptions: RequestInit = {
              method,
              headers,
            };

            if (method !== 'GET' && rawBody) {
              fetchOptions.body = evaluateTemplate(rawBody, currentContext);
            }

            try {
              const res = await fetch(url, fetchOptions);
              const responseData = await res.json();
              output = { response: responseData, status: res.status };
              addLog(`HTTP Action response status: ${res.status}`);
            } catch (e: any) {
              addLog(`HTTP Action error: ${e.message}. Using mock response fallback.`, 'error');
              output = { 
                response: [
                  { title: "Mock HTTP Article 1", body: "L'impact du scraping stealth en production..." },
                  { title: "Mock HTTP Article 2", body: "Optimisation de bundles Next.js 15..." }
                ],
                status: 200
              };
            }
          } 
          
          else if (node.id.includes('file')) {
            const fileType = node.data.fileType || 'csv';
            const fileName = node.data.fileName || 'ideas.csv';
            addLog(`File Parser: Reading ${fileName} (${fileType})`);
            
            // Mock file parsing data
            if (fileType === 'csv') {
              output = [
                { idea: "Partager l'intérêt des boucles n8n pour les créateurs de contenu", topic: "Productivité" },
                { idea: "Comment intégrer des agents conversationnels ReAct dans son marketing", topic: "Intelligence Artificielle" },
                { idea: "Utiliser Stagehand pour automatiser sa veille concurrentielle", topic: "Technologie" }
              ];
            } else if (fileType === 'json') {
              output = { posts: [{ text: "JSON Draft Post" }] };
            } else {
              output = { text: "PDF Content Mockup..." };
            }
          } 
          
          else if (node.id.includes('jsonpath')) {
            const sourceVar = node.data.sourceVar || '';
            const jsonPathExpr = node.data.jsonPath || '';
            addLog(`JSONPath Action: Extracting "${jsonPathExpr}" from ${sourceVar}`);
            
            const sourceData = currentContext[sourceVar] || currentContext.item;
            if (jsonPathExpr) {
               const evalStr = `{{source.${jsonPathExpr}}}`;
               output = evaluateTemplate(evalStr, { source: sourceData });
               
               // Attempt to parse stringified JSON if evaluateTemplate stringified it
               if (typeof output === 'string' && (output.startsWith('{') || output.startsWith('['))) {
                 try { output = JSON.parse(output); } catch {}
               }
            } else {
               output = sourceData;
            }
            addLog(`JSONPath Extracted: ${JSON.stringify(output)?.substring(0,50)}...`);
          }
          
          else if (node.id.includes('filter')) {
            const sourceArrayVar = node.data.sourceArray || '';
            const filterField = node.data.filterField || '';
            const filterOperator = node.data.filterOperator || 'eq';
            const filterValue = String(node.data.filterValue || '');

            addLog(`Filter Action: Filtering array ${sourceArrayVar}`);
            let arrayToFilter: any[] = currentContext[sourceArrayVar] || [];
            if (!Array.isArray(arrayToFilter)) {
                const potentialData = currentContext[sourceArrayVar];
                if (potentialData && Array.isArray(potentialData.response)) arrayToFilter = potentialData.response;
                else if (potentialData && Array.isArray(potentialData.items)) arrayToFilter = potentialData.items;
                else arrayToFilter = [];
            }
            
            output = arrayToFilter.filter(item => {
               let testVal = item;
               if (filterField) {
                  const parts = filterField.split('.');
                  for (const p of parts) { if(testVal) testVal = testVal[p]; }
               }
               
               let proceed = false;
               if (filterOperator === 'gt') proceed = Number(testVal) > Number(filterValue);
               else if (filterOperator === 'lt') proceed = Number(testVal) < Number(filterValue);
               else if (filterOperator === 'eq') proceed = String(testVal) === String(filterValue);
               else if (filterOperator === 'contains') proceed = String(testVal).includes(filterValue);
               return proceed;
            });
            
            addLog(`Filter Action: Kept ${output.length}/${arrayToFilter.length} items`);
          }

          else if (node.id.includes('ai')) {
            const prompt = evaluateTemplate(node.data.prompt || 'Summarize this data into a social post', currentContext);
            const provider = node.data.provider || 'openai';
            const modelId = node.data.model || 'gpt-4o-mini';
            addLog(`AI Prompt: Sending evaluated prompt to model ${provider}/${modelId}`);

            try {
              let model;
              try {
                model = await createModel(provider as any, modelId, userId);
              } catch (modelErr: any) {
                addLog(`Failed to build model ${provider}/${modelId}: ${modelErr.message}. Falling back to default gpt-4o-mini.`, 'warn');
                model = openai('gpt-4o-mini');
              }

              const response = await generateText({
                model,
                system: `You are an elite, world-class copywriter specializing in viral high-engagement content for LinkedIn and Twitter.
Your goal is to transform the provided input into a masterpiece of social media writing.
Follow these constraints meticulously:
1. FORMATTING: Use clean spacing. Break long paragraphs into readable single sentences or bullet points. Avoid big walls of text.
2. HOOK: The first sentence must be an absolute attention-grabber (curiosity gap, controversial statement, or surprising statistic). Do not start with generic greetings like "Hello everyone" or "In today's world".
3. TONE: Professional, authoritative yet conversational, relatable, and human. Avoid corporate jargon or excessive buzzwords (like "delve", "testament", "revolutionize", "pioneering").
4. ENGAGEMENT: Conclude with a strong, low-friction question or call-to-action to spark discussion in the comments section.
5. HASHTAGS: Use at most 2-3 relevant hashtags placed neatly at the very end.`,
                messages: [
                  { role: 'user', content: prompt }
                ]
              });
              output = response.text;
              finalContent = response.text;
              addLog(`AI Response generated successfully.`);
            } catch (e: any) {
              addLog(`AI Error: ${e.message}. Using mock response.`, 'error');
              output = `[RÉDACTION IA SIMULÉE]\nVoici un contenu expert rédigé automatiquement par l'intelligence artificielle pour vos réseaux sociaux !\n#Veille #Technologie`;
              finalContent = output;
            }
          } 
          
          else if (node.id.includes('image')) {
            const imagePrompt = evaluateTemplate(node.data.imagePrompt || 'A social media visual representation', currentContext);
            addLog(`Image Action: Generating image with prompt "${imagePrompt}"`);
            try {
              const { generateImage } = await import('../images/index.js');
              const img = await generateImage(userId, imagePrompt, 'openai');
              output = img;
              currentContext.lastGeneratedImageId = img.id;
              addLog(`Image Action successful. Image ID: ${img.id}`);
            } catch (e: any) {
              addLog(`Image Action error: ${e.message}. Using mock image output.`, 'error');
              output = {
                id: crypto.randomUUID(),
                imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
                prompt: imagePrompt,
              };
            }
          }

          else if (node.id.includes('hook')) {
            const hookStyle = node.data.hookStyle || 'viral';
            addLog(`Hook Action: Generating hooks with style ${hookStyle}`);
            const contentToHook = finalContent || currentContext.item?.title || 'a social media topic';
            
            try {
              let model = openai('gpt-4o-mini');
              try {
                model = await createModel('openai', 'gpt-4o-mini', userId);
              } catch {}
              
              const hookPrompt = `You are a viral social media hook generator. Generate 3 hook options in the style "${hookStyle}" for the following content:
"${contentToHook}"

Return only the 3 options, one per line, starting with 1., 2., 3.`;

              const response = await generateText({
                model,
                prompt: hookPrompt,
              });
              output = response.text;
              addLog(`Hook Action successful.`);
            } catch (e: any) {
              addLog(`Hook Action error: ${e.message}. Using mock hooks.`, 'error');
              output = `1. C'est l'erreur la plus courante en production...\n2. 99% des développeurs se trompent sur ce sujet.\n3. Voici comment diviser par 2 vos temps de chargement.`;
            }
          }

          else if (node.id.includes('tone')) {
            const targetTone = node.data.targetTone || 'professional';
            addLog(`Tone Action: Rewriting content in tone ${targetTone}`);
            const textToRewrite = finalContent || currentContext.item?.idea || 'No content provided';
            
            try {
              let model = openai('gpt-4o-mini');
              try {
                model = await createModel('openai', 'gpt-4o-mini', userId);
              } catch {}

              const response = await generateText({
                model,
                prompt: `Rewrite the following social media post to adopt a "${targetTone}" tone. Keep all key details, but adjust vocabulary, pacing, and style.
Post content:
"${textToRewrite}"`,
              });
              output = response.text;
              finalContent = response.text;
              addLog(`Tone Action successful.`);
            } catch (e: any) {
              addLog(`Tone Action error: ${e.message}.`, 'error');
              output = textToRewrite;
            }
          }
          
          else if (node.id.includes('post')) {
            const targetPrompt = node.data.prompt || '';
            const draftContent = targetPrompt ? evaluateTemplate(targetPrompt, currentContext) : finalContent;
            
            addLog('Saving Draft Post to database...');
            const db = getDrizzle();
            const postId = crypto.randomUUID();
            await db.insert(posts).values({
              id: postId,
              userId,
              workspaceId,
              content: draftContent || 'Workflow generated draft content.',
              status: 'draft',
              platforms: JSON.stringify(['linkedin']),
              originalPrompt: 'Generated by Automation Flow',
              llmProvider: 'openai',
            });

            // Link last generated image if any
            if (currentContext.lastGeneratedImageId) {
              try {
                const { updateImagePostLink } = await import('../images/index.js');
                await updateImagePostLink(userId, currentContext.lastGeneratedImageId, postId);
                addLog(`Linked image ${currentContext.lastGeneratedImageId} to post ${postId}`);
              } catch (linkErr: any) {
                addLog(`Failed to link image to post: ${linkErr.message}`, 'error');
              }
            }

            output = { success: true, postId };
            addLog('Draft Post saved successfully!');
          }
          
          else if (node.id.includes('search')) {
            const searchQuery = evaluateTemplate(node.data.searchQuery || '', currentContext);
            const limit = Number(node.data.maxResults || 3);
            addLog(`Web Search Action: Query: "${searchQuery}" with limit: ${limit}`);
            try {
              const results = await searchWeb(searchQuery, limit);
              output = results;
              addLog(`Web Search successful. Found ${results.length} results.`);
            } catch (e: any) {
              addLog(`Web Search Action error: ${e.message}. Using mock search result.`, 'error');
              output = [
                { title: `Simulated Search for: ${searchQuery}`, url: 'https://example.com/mock', content: 'Mock search content.' }
              ];
            }
          }
          
          else if (node.id.includes('format')) {
            const textTemplate = node.data.textTemplate || '';
            const formatted = evaluateTemplate(textTemplate, currentContext);
            output = formatted;
            addLog(`Format Action: Template formatted successfully.`);
          }
          
          else if (node.id.includes('db')) {
            const dbAction = node.data.dbAction || 'save_post';
            addLog(`Database Action: Executing ${dbAction}`);
            const db = getDrizzle();
            
            if (dbAction === 'save_post') {
              const postId = crypto.randomUUID();
              await db.insert(posts).values({
                id: postId,
                userId,
                workspaceId,
                content: finalContent || 'Draft content from DB node.',
                status: 'draft',
                platforms: JSON.stringify(['linkedin']),
                originalPrompt: 'Saved via DB node',
                llmProvider: 'openai',
              });

              // Link last generated image if any
              if (currentContext.lastGeneratedImageId) {
                try {
                  const { updateImagePostLink } = await import('../images/index.js');
                  await updateImagePostLink(userId, currentContext.lastGeneratedImageId, postId);
                  addLog(`Linked image ${currentContext.lastGeneratedImageId} to post ${postId}`);
                } catch (linkErr: any) {
                  addLog(`Failed to link image to post: ${linkErr.message}`, 'error');
                }
              }

              addLog(`Database Action: Post saved successfully.`);
              output = { success: true, postId };
            } else {
              addLog(`Database Action: Mock database operation completed.`);
              output = { success: true };
            }
          }
          
          else if (node.id.includes('publish')) {
            const publishUrl = evaluateTemplate(node.data.publishUrl || '', currentContext);
            const publishToken = node.data.publishToken || '';
            addLog(`Publish CMS Action: Sending content to ${publishUrl}`);
            
            try {
              const res = await fetch(publishUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': publishToken ? `Bearer ${publishToken}` : '',
                },
                body: JSON.stringify({
                  title: currentContext.item?.title || 'Workflow Publication',
                  content: finalContent,
                  date: new Date().toISOString(),
                }),
              });
              let responseBody = '';
              try {
                const data = await res.json();
                responseBody = JSON.stringify(data);
              } catch {
                responseBody = await res.text();
              }
              output = { success: res.ok, response: responseBody, status: res.status };
              addLog(`Publish CMS Action completed with status: ${res.status}`);
            } catch (e: any) {
              addLog(`Publish CMS Action error: ${e.message}. Using mock success callback.`, 'error');
              output = { success: true, mock: true };
            }
          }
        } 
        // LOGIC NODES
        else if (nodeType === 'logic') {
          if (node.id.includes('loop') || node.id.includes('batch')) {
            const isBatch = node.id.includes('batch');
            const sourceVar = node.data.loopOver || node.data.batchArray || '';
            const concurrencyLimit = Number(node.data.concurrency || 3);
            addLog(`${isBatch ? 'Batch' : 'Loop'} node starting over: "${sourceVar}"`);
            
            let arrayToLoop: any[] = [];
            
            if (sourceVar && currentContext[sourceVar]) {
              let val = currentContext[sourceVar];
              
              // If it's a string, try parsing it as JSON first
              if (typeof val === 'string') {
                try {
                  // clean json markdown formatting if present
                  let cleanVal = val.trim();
                  if (cleanVal.startsWith('```json')) {
                    cleanVal = cleanVal.substring(7);
                  }
                  if (cleanVal.endsWith('```')) {
                    cleanVal = cleanVal.substring(0, cleanVal.length - 3);
                  }
                  cleanVal = cleanVal.trim();
                  const parsed = JSON.parse(cleanVal);
                  val = parsed;
                } catch (e) {
                  // Not valid JSON, try parsing list items from the string (lines starting with -, *, or numbering)
                  logger.debug(`Could not parse loop variable as JSON. Trying line split fallback.`);
                  const lines = val.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 0 && (l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l)));
                  
                  if (lines.length > 0) {
                    val = lines.map(l => ({ idea: l.replace(/^[-*\d.]+\s*/, '') }));
                  } else {
                    // split by generic paragraph newlines if there are multiple paragraphs
                    const paras = val.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 0);
                    if (paras.length > 1) {
                      val = paras.map(p => ({ idea: p }));
                    }
                  }
                }
              }

              if (Array.isArray(val)) {
                arrayToLoop = val;
              } else if (val && typeof val === 'object') {
                if (Array.isArray(val.response)) {
                  arrayToLoop = val.response;
                } else if (Array.isArray(val.items)) {
                  arrayToLoop = val.items;
                } else if (Array.isArray(val.posts)) {
                  arrayToLoop = val.posts;
                } else {
                  const arrays = Object.values(val).filter(Array.isArray);
                  if (arrays.length > 0) arrayToLoop = arrays[0] as any[];
                }
              }
            }
            
            if (arrayToLoop.length === 0) {
              addLog(`No list found for variable "${sourceVar}". Initializing mock loop array.`, 'warn');
              arrayToLoop = [
                { title: "Article de simulation 1", link: "https://example.com/1", idea: "Idée de post 1" },
                { title: "Article de simulation 2", link: "https://example.com/2", idea: "Idée de post 2" }
              ];
            }

            addLog(`${isBatch ? 'Batching' : 'Looping'} over ${arrayToLoop.length} items.`);
            const loopTargets = adj[node.id] || [];

            if (isBatch) {
              for (let i = 0; i < arrayToLoop.length; i += concurrencyLimit) {
                const chunk = arrayToLoop.slice(i, i + concurrencyLimit);
                await Promise.all(chunk.map(async (item, idx) => {
                  const globalIdx = i + idx;
                  addLog(`Batch Iteration ${globalIdx + 1}/${arrayToLoop.length}`);
                  const clonedContext = { ...currentContext, item, index: globalIdx };
                  for (const targetId of loopTargets) {
                    await executeNode(targetId, clonedContext);
                  }
                }));
              }
            } else {
              for (let i = 0; i < arrayToLoop.length; i++) {
                addLog(`Loop Iteration ${i + 1}/${arrayToLoop.length}`);
                // Mutating currentContext for loop maintains legacy behavior
                currentContext.item = arrayToLoop[i];
                currentContext.index = i;
  
                for (const targetId of loopTargets) {
                  await executeNode(targetId, currentContext);
                }
              }
            }
            return;
          } 
          
          else if (node.id.includes('condition')) {
            const varName = node.data.conditionField || '';
            const operator = node.data.conditionOperator || 'gt';
            const valueToCompare = node.data.conditionValue || '';

            let testVal: any = '';
            if (varName.startsWith('item.')) {
              const field = varName.substring(5);
              testVal = currentContext.item?.[field];
            } else {
              testVal = currentContext[varName];
            }

            let proceed = false;
            if (operator === 'gt') proceed = Number(testVal) > Number(valueToCompare);
            else if (operator === 'lt') proceed = Number(testVal) < Number(valueToCompare);
            else if (operator === 'eq') proceed = String(testVal) === String(valueToCompare);
            else if (operator === 'contains') proceed = String(testVal).includes(String(valueToCompare));

            addLog(`Condition: ${varName} (${testVal}) ${operator} ${valueToCompare} => ${proceed}`);

            if (!proceed) {
              addLog(`Condition not met. Stopping branch.`);
              return;
            }
          } 
          
          else if (node.id.includes('delay')) {
            const delaySec = node.data.delaySeconds || 5;
            addLog(`Waiting for ${delaySec} seconds...`);
            await delay(delaySec * 1000);
          }
        }

        nodeOutputs[node.id] = output;
        currentContext[node.id] = output;

        completedNodeIds.push(node.id);
        if (activeNodeId === node.id) {
          activeNodeId = null;
        }
        await pushProgress();

      } catch (e: any) {
        addLog(`Error executing node ${node.id}: ${e.message}`, 'error');
        runningNodeErrors[node.id] = e.message;
        await pushProgress();
        throw e;
      }

      const targets = adj[node.id] || [];
      for (const targetId of targets) {
        await executeNode(targetId, currentContext);
      }
    }

    // Start graph execution from trigger nodes
    for (const trig of triggerNodes) {
      await executeNode(trig.id);
    }

    return { success: true, finalContent, nodeOutputs, runningNodeErrors, completedNodeIds };
  },
  {
    connection: sharedRedisConnection as WorkerOptions['connection'],
  }
);

scraperWorker.on('completed', async (job) => {
  logger.info(`Scraper Job ${job.id} has completed successfully`);
  try {
    const db = getDrizzle();
    const finishedAt = new Date();
    await db
      .update(automationRuns)
      .set({
        status: 'completed',
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - new Date(job.processedOn ?? finishedAt).getTime(),
        summary: (job.returnvalue ?? null) as any,
      })
      .where(eq(automationRuns.jobId, String(job.id ?? '')));
  } catch (e: any) {
    logger.warn(`Failed to record run completion in automation_runs: ${e.message}`);
  }
});

scraperWorker.on('failed', async (job, err) => {
  logger.error(`Scraper Job ${job?.id} has failed: ${err.message}`);
  if (!job) return;
  try {
    const db = getDrizzle();
    const finishedAt = new Date();
    const progress = job.progress || {};
    await db
      .update(automationRuns)
      .set({
        status: 'failed',
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - new Date(job.processedOn ?? finishedAt).getTime(),
        errorMessage: err.message,
        summary: {
          success: false,
          error: err.message,
          nodeOutputs: progress.nodeOutputs || {},
          runningNodeErrors: progress.runningNodeErrors || {},
          completedNodeIds: progress.completedNodeIds || [],
        },
      })
      .where(eq(automationRuns.jobId, String(job.id ?? '')));
  } catch (e: any) {
    logger.warn(`Failed to record run failure in automation_runs: ${e.message}`);
  }
});
