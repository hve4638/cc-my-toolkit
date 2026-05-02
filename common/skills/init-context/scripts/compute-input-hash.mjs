#!/usr/bin/env node
import crypto from 'node:crypto';
import process from 'node:process';

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', reject);
  });
}

function canonicalize(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const sortedKeys = Object.keys(value).sort();
  const out = {};
  for (const key of sortedKeys) out[key] = canonicalize(value[key]);
  return out;
}

async function main() {
  const raw = await readStdin();
  if (!raw.trim()) {
    console.error('compute-input-hash: empty stdin');
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`compute-input-hash: invalid JSON: ${err.message}`);
    process.exit(1);
  }
  const canonical = JSON.stringify(canonicalize(parsed));
  const hex = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  process.stdout.write(`sha256-${hex}\n`);
}

main().catch((err) => {
  console.error(`compute-input-hash: ${err.message}`);
  process.exit(1);
});
