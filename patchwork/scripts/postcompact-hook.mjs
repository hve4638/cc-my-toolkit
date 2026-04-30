#!/usr/bin/env node
import { compactReset, ensureCacheDir, resolveProjectRoot } from '../_build/src/lib/state-file.mjs';

function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function readStdin() {
  return new Promise((resolveStdin) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolveStdin(data));
  });
}

async function main() {
  const raw = await readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return emit({ continue: true });
  }

  const { session_id, agent_id, cwd } = input;
  if (!session_id) return emit({ continue: true });

  const projectRoot = resolveProjectRoot(input);
  ensureCacheDir(projectRoot);
  compactReset({ projectRoot, sessionId: session_id, agentId: agent_id });
  emit({ continue: true });
}

main().catch(() => emit({ continue: true }));
