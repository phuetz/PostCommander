import fs from 'fs';

let content = fs.readFileSync('src/db/schema.ts', 'utf-8');

// replace timestamp('name') with timestamp('name', { mode: 'string' })
content = content.replace(/timestamp\('([^']+)'\)(?!\s*,\s*\{)/g, "timestamp('$1', { mode: 'string' })");

fs.writeFileSync('src/db/schema.ts', content);
console.log('Schema timestamp fixed.');
