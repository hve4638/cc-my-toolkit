#!/usr/bin/env node
/**
 * Stop Hook: Context Guard
 *
 * Warns the user (via additionalContext) when transcript size crosses a
 * threshold, suggesting a session refresh. Does NOT block by default —
 * flip BLOCK_WHEN_OVER to `true` to force Claude to continue-with-refresh.
 *
 * Threshold via env `FRAME_CONTEXT_GUARD_BYTES` (default: 500_000 bytes
 * of transcript file). Never blocks context_limit or user-cancel stops.
 */

import { existsSync, statSync } from 'node:fs';
import { readStdin } from './lib/stdin.mjs';

const DEFAULT_THRESHOLD_BYTES = 500_000;
const BLOCK_WHEN_OVER = false;

async function main() {
  const input = await readStdin(1000);
  let data = {};
  try { data = JSON.parse(input); } catch {
    process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  // Never interfere with compactor or user-cancel stops
  if (data?.stop_hook_active || data?.hook_event_name !== 'Stop') {
    process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  const threshold = parseInt(process.env.FRAME_CONTEXT_GUARD_BYTES ?? '', 10) || DEFAULT_THRESHOLD_BYTES;
  const transcriptPath = data?.transcript_path;
  let size = 0;
  if (transcriptPath && existsSync(transcriptPath)) {
    try { size = statSync(transcriptPath).size; } catch { /* ignore */ }
  }

  if (size < threshold) {
    process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  const reason = `Context guard: transcript is ${(size / 1000).toFixed(0)}KB (threshold ${(threshold / 1000).toFixed(0)}KB). Consider starting a fresh session soon to maintain quality.`;

  if (BLOCK_WHEN_OVER) {
    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
    return;
  }

  // WHY: Stop 훅 스키마는 hookSpecificOutput.Stop 미지원. 본 훅은
  //      block 회피가 명시 의도(BLOCK_WHEN_OVER=false) 라 decision:block
  //      대신 systemMessage 로 사용자 UI 알림만.
  process.stdout.write(JSON.stringify({
    continue: true,
    systemMessage: reason,
  }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
});
