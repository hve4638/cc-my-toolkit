import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { createHash } from 'crypto';

function sha256(s) {
  return createHash('sha256').update(s).digest('hex');
}

export function readContextChain(startDir, { cache }) {
  const entries = [];
  let dir = resolve(startDir);
  while (true) {
    const ctxPath = join(dir, 'CONTEXT.md');
    let content;
    try {
      content = readFileSync(ctxPath, 'utf-8');
    } catch {
      content = null;
    }
    if (content !== null) {
      const key = resolve(ctxPath);
      const hash = sha256(content);
      const prev = cache.hashes[key];
      let status;
      if (prev === undefined) status = 'new';
      else if (prev === hash) status = 'unchanged';
      else status = 'updated';
      // WHY: unchanged 면 cache.hashes 가 이미 hash 와 동일 — set 생략으로
      //      모든 entry 가 unchanged 인 chain 은 atomic write 자체를 skip 할
      //      수 있다 (caller 가 changed 여부를 보고 saveCache 결정).
      if (status !== 'unchanged') cache.hashes[key] = hash;
      entries.push({ path: key, status, content });
    }
    const parent = dirname(dir);
    // WHY: path.dirname('/') === '/' 라 종료 조건이 없으면 무한 루프.
    if (parent === dir) break;
    dir = parent;
  }
  // top-down: 루트 → 리프 순서로 LLM 이 좁아지는 흐름을 본다.
  return entries.reverse();
}

function wrap(entry, body) {
  return `<patchwork-context path="${entry.path}">\n${body}\n</patchwork-context>`;
}

export function formatForHook(entries) {
  const blocks = entries
    .filter((e) => e.status !== 'unchanged')
    .map((e) => wrap(e, e.status === 'updated' ? `(updated)\n${e.content}` : e.content));
  return blocks.join('\n');
}

export function formatForMcp(entries) {
  // WHY: MCP 는 LLM 의 명시 호출이라 같은 파일을 두 번 read 했을 때
  //      "이번 응답에 본문이 빠진 자리" 를 placeholder 로 알려야 한다.
  //      hook 은 자동 주입이라 omit 으로 충분.
  const blocks = entries.map((e) => {
    if (e.status === 'unchanged') return wrap(e, '(already read)');
    if (e.status === 'updated') return wrap(e, `(updated)\n${e.content}`);
    return wrap(e, e.content);
  });
  return blocks.join('\n');
}
