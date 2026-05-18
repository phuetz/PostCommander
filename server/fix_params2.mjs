import fs from 'fs';

function fixFile(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/eq\(platformConnections\.platform,\s*platform\)/g, 'eq(platformConnections.platform, platform as string)');
    content = content.replace(/eq\(connectionsTable\.platform,\s*platformId\)/g, 'eq(connectionsTable.platform, platformId as string)');
    fs.writeFileSync(file, content);
}

fixFile('src/controllers/oauth.controller.ts');
fixFile('src/workers/publishing.worker.ts');
fixFile('src/services/posts/index.ts');
fixFile('src/controllers/platforms.controller.ts');
