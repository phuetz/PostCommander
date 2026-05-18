import fs from 'fs';

let testDb = fs.readFileSync('src/test-utils/test-db.ts', 'utf-8');
testDb = testDb.replace(/export function resetTestDatabase\(\) {/g, 'export async function resetTestDatabase() {');
testDb = testDb.replace(/db\.exec\(/g, 'await db.query(');
fs.writeFileSync('src/test-utils/test-db.ts', testDb);

let mcp = fs.readFileSync('src/mcp/server.ts', 'utf-8');
mcp = mcp.replace(/const id = `post_\${Date.now()}`;[\s\n]*\/\/ Note: Assuming a mock user_id for the MCP context unless injected via auth/g, '// Note: Assuming a mock user_id for the MCP context unless injected via auth');
fs.writeFileSync('src/mcp/server.ts', mcp);
