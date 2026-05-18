import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // Fix createModel
  if (!filePath.endsWith('provider-factory.ts') && !filePath.endsWith('bridge-proposal.test.ts') && !filePath.endsWith('assist.controller.test.ts')) {
    content = content.replace(/createModel\(/g, 'await createModel(');
    content = content.replace(/await\s+await\s+createModel\(/g, 'await createModel(');
  }

  // Fix specific files
  if (filePath.replace(/\\/g, '/').endsWith('routes/index.ts')) {
    content = content.replace(/db\.prepare\('SELECT 1'\)\.get\(\);/g, 'await pool.query(\'SELECT 1\');');
    content = content.replace(/const db = getDb\(\);/g, 'const pool = getDb();');
  }

  if (filePath.replace(/\\/g, '/').endsWith('services/jobs/worker.ts')) {
    // This file had: const row = db.prepare('SELECT status, platforms, user_id FROM posts WHERE id = ?').get(job.data.postId)
    content = content.replace(/const row = db\s*\.prepare\('SELECT status, platforms, user_id FROM posts WHERE id = \?'\)\s*\.get\(job\.data\.postId\)/g, "const row = await db.query('SELECT status, platforms, user_id FROM posts WHERE id = $1', [job.data.postId]).then(res => res.rows[0])");
    // need to adjust getDb -> db pool.
    content = content.replace(/const db = getDb\(\);/g, 'const db = getDb();');
  }

  if (filePath.replace(/\\/g, '/').endsWith('mcp/server.ts')) {
    content = content.replace(/const row = db\.prepare\('SELECT COUNT\(\*\) as count FROM posts'\)\.get\(\) as { count: number };/g, "const { rows } = await pool.query('SELECT COUNT(*) as count FROM posts'); const row = rows[0] as { count: number };");
    content = content.replace(/const published = db\.prepare\('SELECT COUNT\(\*\) as count FROM posts WHERE status = \?'\)\.get\('published'\) as { count: number };/g, "const { rows: publishedRows } = await pool.query('SELECT COUNT(*) as count FROM posts WHERE status = $1', ['published']); const published = publishedRows[0] as { count: number };");
    content = content.replace(/const stmt = db\.prepare\(`([\s\S]*?)`\);\n\s*const recentPosts = stmt\.all\(\) as any\[\];/g, "const { rows: recentPosts } = await pool.query(`$1`);");
    content = content.replace(/const db = getDb\(\);/g, 'const pool = getDb();');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walk('src');
