'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const viteEntry = path.resolve(__dirname, '../node_modules/vite/bin/vite.js');
const children = [
  spawn(process.execPath, ['backend/server.cjs'], { stdio: 'inherit' }),
  spawn(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', process.env.VITE_PORT || '3000', '--strictPort'], { stdio: 'inherit' })
];
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill();
  if (exitCode) process.exitCode = exitCode;
}

for (const child of children) {
  child.once('error', (error) => {
    console.error('A SENTRIX development service could not start:', error.message);
    stop(1);
  });
  child.once('exit', (code, signal) => {
    if (!stopping) {
      console.error(`A SENTRIX development service stopped (${signal || code}).`);
      stop(code || 1);
    }
  });
}

process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
