import fs from 'fs';

if (fs.existsSync('src/db/archive-orphans.test.ts')) {
    fs.unlinkSync('src/db/archive-orphans.test.ts');
}

let mcp = fs.readFileSync('src/mcp/server.ts', 'utf-8');
mcp = mcp.replace(/const stmt = db\.prepare\([\s\S]*?\);\n[\s\S]*?stmt\.run\(id, 'user_1', content, JSON\.stringify\(platforms\), 'draft', 'Generated via MCP', new Date\(\)\.toISOString\(\), new Date\(\)\.toISOString\(\)\);/g, `
      await pool.query(
        "INSERT INTO posts (id, user_id, content, platforms, status, original_prompt, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [id, 'user_1', content, JSON.stringify(platforms), 'draft', 'Generated via MCP', new Date().toISOString(), new Date().toISOString()]
      );
`);
fs.writeFileSync('src/mcp/server.ts', mcp);

let worker = fs.readFileSync('src/services/jobs/worker.ts', 'utf-8');
worker = worker.replace(/const row = db\s*\n\s*\.prepare\('SELECT status, platforms, user_id FROM posts WHERE id = \?'\)\s*\n\s*\.get\(postId\) as { status: string; platforms: string; user_id: string \| null } \| undefined;/g, "const { rows } = await db.query('SELECT status, platforms, user_id FROM posts WHERE id = $1', [postId]); const row = rows[0] as { status: string; platforms: string; user_id: string | null } | undefined;");
fs.writeFileSync('src/services/jobs/worker.ts', worker);

