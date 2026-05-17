import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { z } from 'zod';
import db from '../db/index.js';

// Initialize MCP Server
export const mcpServer = new McpServer({
  name: 'PostCommander',
  version: '1.0.0',
});

// 1. Tool: Get Analytics
mcpServer.tool(
  'get_analytics',
  'Get social media analytics and metrics for the current workspace',
  {},
  async () => {
    try {
      // Very simplified DB call for MCP example
      const row = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
      const published = db.prepare('SELECT COUNT(*) as count FROM posts WHERE status = ?').get('published') as { count: number };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalPosts: row.count,
              publishedPosts: published.count,
              platformPerformance: {
                linkedin: { impressions: 12450, engagementRate: '4.2%' },
                twitter: { impressions: 8300, engagementRate: '2.1%' }
              }
            }, null, 2),
          },
        ],
      };
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  }
);

// 2. Tool: Create Draft Post
mcpServer.tool(
  'create_draft_post',
  'Create a new draft post in PostCommander',
  {
    content: z.string().describe('The content of the social media post'),
    platforms: z.array(z.string()).describe('List of platform IDs (e.g., ["linkedin", "twitter"])')
  },
  async ({ content, platforms }) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO posts (id, user_id, content, platforms, status, original_prompt, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const id = `post_${Date.now()}`;
      // Note: Assuming a mock user_id for the MCP context unless injected via auth
      stmt.run(id, 'user_1', content, JSON.stringify(platforms), 'draft', 'Generated via MCP', new Date().toISOString(), new Date().toISOString());
      
      return {
        content: [
          {
            type: 'text',
            text: `Draft post created successfully with ID: ${id}`,
          },
        ],
      };
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  }
);

// We need a map of active transports for SSE
let transport: SSEServerTransport | null = null;

export const mcpRouter = express.Router();

mcpRouter.get('/sse', async (req, res) => {
  transport = new SSEServerTransport('/mcp/messages', res);
  await mcpServer.server.connect(transport);
});

mcpRouter.post('/messages', async (req, res) => {
  if (!transport) {
    res.status(500).json({ error: 'SSE Transport not initialized. Connect to /sse first.' });
    return;
  }
  await transport.handlePostMessage(req, res);
});
