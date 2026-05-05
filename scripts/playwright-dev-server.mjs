import { spawn } from 'node:child_process';

const target = process.argv[2];

if (target !== 'server' && target !== 'client') {
  console.error('Usage: node scripts/playwright-dev-server.mjs <server|client>');
  process.exit(1);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const serverPort = process.env.PLAYWRIGHT_SERVER_PORT ?? '3101';
const clientPort = process.env.PLAYWRIGHT_CLIENT_PORT ?? '4173';

const baseEnv = {
  ...process.env,
  PORT: serverPort,
  NODE_ENV: process.env.NODE_ENV ?? 'test',
  BASE_URL: `http://127.0.0.1:${serverPort}`,
  CLIENT_URL: `http://127.0.0.1:${clientPort}`,
  VITE_API_URL: `http://127.0.0.1:${serverPort}/api`,
};

const args =
  target === 'server'
    ? ['run', 'dev', '-w', '@postcommander/server']
    : [
        'run',
        'dev',
        '-w',
        '@postcommander/client',
        '--',
        '--host',
        '127.0.0.1',
        '--port',
        clientPort,
      ];

const child =
  process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', npmCommand, ...args], {
        stdio: 'inherit',
        env: baseEnv,
      })
    : spawn(npmCommand, args, {
        stdio: 'inherit',
        env: baseEnv,
      });

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
