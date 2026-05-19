import { describe, it, expect, vi, beforeEach } from 'vitest';

const generateTextMock = vi.hoisted(() => vi.fn());
const createModelMock = vi.hoisted(() => vi.fn());

vi.mock('ai', () => ({ generateText: generateTextMock }));
vi.mock('../llm/provider-factory.js', () => ({ createModel: createModelMock }));

import { runWorkflowBuilderAgent } from './workflow-builder.js';

describe('runWorkflowBuilderAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createModelMock.mockResolvedValue({ id: 'mock-model' });
  });

  it('correctly builds, executes agent, and parses tool results or text responses', async () => {
    // Mock generateText to return a simple response
    // And simulate a tool call or a final text response.
    // Since our implementation runs generateText with toolCalls,
    // let's simulate a response that provides a final text summary and tool call result.
    generateTextMock.mockImplementation(async (options: any) => {
      if (options.tools?.setWorkflowState?.execute) {
        await options.tools.setWorkflowState.execute({
          nodes: [
            { id: 'node_1', type: 'customNode', data: { label: 'Scraper', type: 'action', iconName: 'Search' }, position: { x: 100, y: 100 } }
          ],
          edges: []
        });
      }
      return {
        text: "J'ai configuré un workflow simple de scraping.",
        steps: [
          {
            text: "Searching HN...",
            toolCalls: [
              {
                toolName: 'searchWeb',
                args: { query: 'Hacker News RSS' },
              }
            ]
          }
        ],
        toolResults: [
          {
            toolName: 'setWorkflowState',
            args: {
              nodes: [
                { id: 'node_1', type: 'customNode', data: { label: 'Scraper', type: 'action', iconName: 'Search' }, position: { x: 100, y: 100 } }
              ],
              edges: []
            },
            result: { success: true }
          }
        ]
      };
    });

    const options = {
      messages: [{ role: 'user', content: 'Ajoute un scraper' }],
      currentState: { nodes: [], edges: [] },
      userId: 'test-user-id',
    };

    const result = await runWorkflowBuilderAgent(options.userId, options.messages, options.currentState);

    expect(createModelMock).toHaveBeenCalledWith('openai', 'gpt-4o-mini', 'test-user-id');
    expect(generateTextMock).toHaveBeenCalled();
    expect(result.text).toContain('configuré');
    expect(result.nextState.nodes).toHaveLength(1);
    expect(result.nextState.nodes[0].id).toBe('node_1');
    expect(result.steps).toBeDefined();
    expect(result.steps![0].toolCalls![0].name).toBe('searchWeb');
  });

  it('handles assistant responses with no tool calls and retains current state', async () => {
    generateTextMock.mockResolvedValue({
      text: "Désolé, je n'ai pas compris ce que vous vouliez ajouter.",
      toolResults: []
    });

    const initialNodes = [{ id: 'trig_0', type: 'customNode', data: { label: 'Webhook', type: 'trigger', iconName: 'Zap' }, position: { x: 0, y: 0 } }];
    const options = {
      messages: [{ role: 'user' as const, content: 'Bonjour' }],
      currentState: { nodes: initialNodes, edges: [] },
      userId: 'test-user-id',
    };

    const result = await runWorkflowBuilderAgent(options.userId, options.messages, options.currentState);

    expect(result.text).toContain('Désolé');
    expect(result.nextState.nodes).toEqual(initialNodes);
  });
});
