#!/usr/bin/env node
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readStdin } from './lib/stdin.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

async function main() {
  const input = await readStdin(1000);
  try {
    const data = JSON.parse(input);
    const { onSessionEnd } = require(join(__dirname, '..', 'bridge', 'session-hooks.cjs'));
    const result = onSessionEnd(data);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('[wiki-session-end] Error:', error.message);
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  }
}

main();
