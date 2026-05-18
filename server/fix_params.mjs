import fs from 'fs';

let pFile = fs.readFileSync('src/controllers/platforms.controller.ts', 'utf-8');
pFile = pFile.replace(/eq\(platformConnections\.platform,\s*platform\)/g, 'eq(platformConnections.platform, platform as string)');
fs.writeFileSync('src/controllers/platforms.controller.ts', pFile);

let wFile = fs.readFileSync('src/controllers/workspaces.controller.ts', 'utf-8');
wFile = wFile.replace(/workspaceId,\n\s*userId: targetUser\.id,/g, 'workspaceId: workspaceId as string,\n    userId: targetUser.id,');
fs.writeFileSync('src/controllers/workspaces.controller.ts', wFile);
