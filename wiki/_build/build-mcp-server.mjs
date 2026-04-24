#!/usr/bin/env node
/**
 * Build script for wiki plugin bundles.
 * Produces two CJS bundles in ../bridge/:
 *   mcp-server.cjs    — standalone MCP server (entry point in .mcp.json)
 *   session-hooks.cjs — session hook implementations (required by hook .mjs scripts)
 */

import * as esbuild from 'esbuild';
import { mkdir } from 'fs/promises';

await mkdir('../bridge', { recursive: true });

const watchMode = process.argv.includes('--watch');

const buildConfig = {
  entryPoints: [
    { in: 'src/mcp/standalone-server.ts', out: 'mcp-server' },
    { in: 'src/hooks/wiki/session-hooks.ts', out: 'session-hooks' },
  ],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outdir: '../bridge',
  outExtension: { '.js': '.cjs' },
  mainFields: ['module', 'main'],
  external: [
    'fs', 'path', 'os', 'util', 'stream', 'events',
    'buffer', 'crypto', 'http', 'https', 'url',
    'child_process', 'assert', 'module', 'net', 'tls',
    'dns', 'readline', 'tty', 'worker_threads',
  ],
};

if (watchMode) {
  const ctx = await esbuild.context(buildConfig);
  await ctx.watch();
  console.log('Watching ../bridge/{mcp-server,session-hooks}.cjs ...');
} else {
  await esbuild.build(buildConfig);
  console.log('Built ../bridge/mcp-server.cjs + ../bridge/session-hooks.cjs');
}
