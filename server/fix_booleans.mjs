import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  content = content.replace(/isReplied:\s*0/g, 'isReplied: false');
  content = content.replace(/isReplied:\s*1/g, 'isReplied: true');
  content = content.replace(/cancelAtPeriodEnd:\s*0/g, 'cancelAtPeriodEnd: false');
  content = content.replace(/cancelAtPeriodEnd:\s*1/g, 'cancelAtPeriodEnd: true');
  content = content.replace(/requiresHuman:\s*0/g, 'requiresHuman: false');
  content = content.replace(/requiresHuman:\s*1/g, 'requiresHuman: true');
  content = content.replace(/isResolved:\s*0/g, 'isResolved: false');
  content = content.replace(/isResolved:\s*1/g, 'isResolved: true');
  content = content.replace(/hasAutoPlugged\s*=\s*0/g, 'hasAutoPlugged = false');
  content = content.replace(/hasAutoPlugged\s*=\s*1/g, 'hasAutoPlugged = true');
  content = content.replace(/hasAutoPlugged:\s*0/g, 'hasAutoPlugged: false');
  content = content.replace(/hasAutoPlugged:\s*1/g, 'hasAutoPlugged: true');

  content = content.replace(/\?\s*1\s*:\s*0/g, '? true : false');
  content = content.replace(/!==\s*1/g, '!== true');
  content = content.replace(/===\s*1/g, '=== true');
  content = content.replace(/eq\(([^,]+),\s*0\)/g, 'eq($1, false)');
  content = content.replace(/eq\(([^,]+),\s*1\)/g, 'eq($1, true)');
  
  content = content.replace(/toBe\(1\)/g, 'toBe(true)');
  content = content.replace(/toBe\(0\)/g, 'toBe(false)');

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
