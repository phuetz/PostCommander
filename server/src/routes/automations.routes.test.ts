import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mockedAgentResponse = {
  text: "J'ai mis à jour le workflow.",
  nextState: {
    nodes: [
      { id: 'node_1', type: 'customNode', data: { label: 'Node 1' }, position: { x: 0, y: 0 } }
    ],
    edges: []
  }
};

vi.mock('../services/agent/workflow-builder.js', () => ({
  runWorkflowBuilderAgent: vi.fn(async () => mockedAgentResponse),
}));

import { createApp } from '../app.js';
import {
  closeTestDatabase,
  createAuthToken,
  createTestUser,
  initTestDatabase,
  resetTestDatabase,
} from '../test-utils/test-db.js';
import { runWorkflowBuilderAgent } from '../services/agent/workflow-builder.js';

describe('Automations Agent Routes', () => {
  const app = createApp();

  beforeAll(() => {
    initTestDatabase();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetTestDatabase();
  });

  it('requires authentication for agent build endpoint', async () => {
    const response = await request(app)
      .post('/api/automations/agent/build')
      .send({ messages: [], currentState: { nodes: [], edges: [] } });
    expect(response.status).toBe(401);
  });

  it('calls runWorkflowBuilderAgent and returns text and updated workflow state', async () => {
    const user = await createTestUser({ email: 'builder-user@example.com' });
    const authToken = createAuthToken(user.id);

    const payload = {
      messages: [{ role: 'user', content: 'Crée un workflow de scraping' }],
      currentState: {
        nodes: [{ id: 'trig-webhook_0', type: 'customNode', position: { x: 0, y: 0 }, data: { label: 'Webhook', type: 'trigger' } }],
        edges: []
      }
    };

    const response = await request(app)
      .post('/api/automations/agent/build')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      text: mockedAgentResponse.text,
      workflow: mockedAgentResponse.nextState,
    });
    expect(runWorkflowBuilderAgent).toHaveBeenCalledWith(
      user.id,
      payload.messages,
      payload.currentState
    );
  });
});
