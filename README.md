# hve-cc-marketplace

Claude Code 용 개인 플러그인 마켓플레이스.

## 플러그인

| 이름 | 설명 |
|---|---|
| [`common`](./common) | 공통 유틸 스킬 (setup, docs, rules, commit/PR, review) |
| [`frame`](./frame) | 런타임 프레임워크 — 범용 에이전트 19 + 훅 기반 규칙 리마인더·컨텍스트 가드 + MCP 서버 (LSP 12 + AST Grep 2) |
| [`expert`](./expert) | 고급·특수 툴 — Python REPL MCP. 향후 ralph 같은 무거운 워크플로 스킬 예정 |
| [`hud`](./hud) | statusline — git/ctx%/rate-limit/모델명/subagent 트리 |
| [`research`](./research) | 리서치 워크플로 (journal, plan, report, commit) |
| [`aris`](./aris) | 학술 논문 자동화 (Autonomous Research In Sleep) |

## 설치

```bash
# 1. 마켓플레이스 추가
/plugin marketplace add https://github.com/hve4638/hve-cc-marketplace

# 2. 원하는 플러그인 설치
/plugin install common@hve
/plugin install frame@hve
/plugin install expert@hve
/plugin install hud@hve
/plugin install research@hve
/plugin install aris@hve
```

## 설치 후 설정

| 플러그인 | 후속 명령 |
|---|---|
| frame | `/hve:frame-setup` — `@ast-grep/napi@0.41.1` 글로벌 설치 |
| hud | `/hve:hud setup` — statusline wrapper + settings.json 등록 |

## 갱신

```bash
/plugin marketplace update hve
```
