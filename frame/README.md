# frame

Claude 의 동작 방식을 수정하는 런타임 레이어 플러그인

## 설치

### 1. 플러그인 설치

```bash
/plugin marketplace add https://github.com/hve4638/hve-cc-marketplace
/plugin install frame@hve

# 클로드 재실행 후
/frame-setup

# 클로드 재실행
```

## 기능

### 1. 범용 에이전트 카탈로그

19 개 plugin-independent 서브에이전트. 다른 플러그인·스킬에서 `Task(subagent_type="<name>", ...)` 로 호출 가능.

| 카테고리 | 에이전트 |
|---|---|
| 탐색·계획 | explore, analyst, planner, architect |
| 구현 | executor, code-simplifier, designer, writer |
| 검증 | verifier, critic, code-reviewer, security-reviewer, test-engineer |
| 디버깅·분석 | debugger, tracer, qa-tester, scientist |
| 기타 | document-specialist, git-master |

---

### 2. 툴 사용 규율 리마인더

**메커니즘**: PreToolUse 훅 (`scripts/pre-tool-enforcer.mjs`, matcher `*`, timeout 3s)

모든 툴 호출 직전 `<system-reminder>` 주입. dedup 없음 — 매 호출마다 주입.

| 툴 | 주입되는 규칙 |
|---|---|
| `Bash` | Prefer dedicated tools (Read, Grep, Glob, Edit) over shell equivalents. |
| `Read` | Read multiple files in parallel when possible. |
| `Grep` | Use Grep (ripgrep) — never shell grep/rg. |
| `Write` / `Edit` | Verify the change after writing. Prefer Edit over Write for existing files. |
| 그 외 | 주입 없음 (`suppressOutput`) |

---

### 3. 컨텍스트 가드

**메커니즘**: Stop 훅 (`scripts/context-guard-stop.mjs`, matcher `*`, timeout 5s)

세션 Stop 지점에서 트랜스크립트 파일 크기 측정.

- `FRAME_CONTEXT_GUARD_BYTES` (기본 500000) 초과 → `additionalContext` 로 경고 주입
- 컴팩터·사용자 취소 stop → 간섭 없음
- 스크립트 내 `BLOCK_WHEN_OVER = true` 로 바꾸면 Stop 차단

---

### 4. 코드 인텔리전스 (LSP)

**메커니즘**: MCP 서버 `t` (`bridge/mcp-server.cjs`, `.mcp.json` 으로 등록)

언어 서버 기반 12 개 툴: `hover`, `goto_definition`, `find_references`, `document_symbols`, `workspace_symbols`, `diagnostics`, `diagnostics_directory`, `servers`, `prepare_rename`, `rename`, `code_actions`, `code_action_resolve`.

**의존**: 사용자 `PATH` 의 언어 서버 (`gopls`, `typescript-language-server`, `pyright` 등). 설치 안 된 언어는 해당 LSP 호출 시 에러 반환.

---

### 5. 구조 검색·치환 (AST Grep)

**메커니즘**: MCP 서버 `t` (#4 와 동일 서버 공유)

AST 패턴 기반 2 개 툴: `ast_grep_search`, `ast_grep_replace`. 정규식의 구문 인식 한계를 극복.

---

### 6. 스펙 크리스털라이즈

**메커니즘**: `skills/interview`

Socratic 질의응답으로 모호한 아이디어 → 수학적 ambiguity 게이팅 → spec 파일 산출.

내부적으로 #1 의 `explore` 에이전트를 사용해 brownfield/greenfield 판정·코드베이스 탐색을 수행.

---

## 부록 — 개발자용

### 러너 (`scripts/run.cjs`)

모든 훅의 실제 진입점 (`hooks.json` 이 호출).

- `process.execPath` 로 Node 직접 spawn — PATH / 셸 의존 제거
- `CLAUDE_PLUGIN_ROOT` 가 stale 이면 캐시 디렉터리 스캔 후 최신 버전 스크립트로 폴백
- `hooks.json` 의 `timeout` 파싱 후 자식 프로세스에 적용
- 모든 에러 경로 fail-open (exit 0)

### MCP 재빌드

`_build/src/` 에 MCP 서버 TypeScript 소스 포함. 툴 추가·제외 시 `_build/src/mcp/tool-registry.ts` 편집 후:

```bash
cd _build
pnpm install
node build-mcp-server.mjs
```

출력: `bridge/mcp-server.cjs`.
