import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection.js';

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
      const pool = getDb();
      const { rows } = await pool.query('SELECT COUNT(*) as count FROM posts'); const row = rows[0] as { count: number };
      const { rows: publishedRows } = await pool.query('SELECT COUNT(*) as count FROM posts WHERE status = $1', ['published']); const published = publishedRows[0] as { count: number };
      
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
      const pool = getDb();
      const id = `post_${Date.now()}`;
      await pool.query(
        "INSERT INTO posts (id, user_id, content, platforms, status, original_prompt, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [id, 'user_1', content, JSON.stringify(platforms), 'draft', 'Generated via MCP', new Date().toISOString(), new Date().toISOString()]
      );

      
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
