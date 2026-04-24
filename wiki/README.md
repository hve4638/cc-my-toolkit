# wiki

Karpathy LLM Wiki 개념 기반 영속 마크다운 지식 베이스 플러그인.

세션을 넘어 누적되는 프로젝트 지식(아키텍처, 결정, 디버깅 노트, 컨벤션 등)을 `.wiki/` 에 페이지 단위 마크다운으로 저장. Claude 가 MCP 툴을 통해 자동 저장·검색하며, 사용자는 평소처럼 자연어로 Claude 와 대화.

## 설치

```bash
/plugin marketplace add https://github.com/hve4638/hve-cc-marketplace
/plugin install wiki@hve
```

별도 setup 불필요. 설치 후 새 세션부터 바로 동작.

## 어떻게 사용되나

**사용자 ↔ Claude 는 자연어**, **Claude ↔ wiki 는 MCP 툴 호출** — 아래 예시처럼 진행.

### 예시 1: 결정 사항 저장

> **사용자**: "방금 DB 드라이버를 pg 로 가기로 한 결정 이유 정리해서 wiki 에 남겨줘"
>
> → Claude 가 `wiki_add` 를 호출해 `.wiki/db-driver-decision.md` 생성

### 예시 2: 과거 조사 소환

> **사용자**: "예전에 JWT refresh token 관련해서 정리한 거 있었지? 찾아봐"
>
> → Claude 가 `wiki_query({ query: "JWT refresh" })` 로 검색해 관련 페이지 스니펫 제시

### 예시 3: 지식 누적

> **사용자**: "이 세션에서 알아낸 N+1 해결 패턴을 기존 Postgres 페이지에 추가해줘"
>
> → 같은 slug 페이지가 있으면 Claude 가 `wiki_ingest` 로 append merge (기존 내용 유지 + 타임스탬프 섹션 추가)

### 예시 4: 건강도 점검

> **사용자**: "wiki 상태 점검해줘. 오래된 페이지나 깨진 링크 있어?"
>
> → Claude 가 `wiki_lint` 호출, stale/orphan/broken-ref 등 보고

### 예시 5: 자동 세션 로그

사용자 개입 없이 세션 종료 시 **`autoCapture: true`** 면 `session-log-<date>-<id>.md` 가 자동 기록됨 (메타데이터만, LLM 호출 없음).

## 자동 동작 (훅)

사용자가 의식하지 않아도 아래 훅이 배경에서 돈다.

| 이벤트 | 동작 | timeout |
|---|---|---|
| **SessionStart** | `.wiki/index.md` lazy rebuild, 페이지 수·카테고리 요약을 Claude 컨텍스트에 주입 → Claude 가 "이 프로젝트에 어떤 wiki 가 있는지" 세션 시작부터 앎 | 5s |
| **PreCompact** | `[Wiki: N pages \| categories: … \| last: …]` 한 줄 주입 → compact 후에도 wiki 존재 기억 | 3s |
| **Stop** | `autoCapture=true` 면 세션 메타를 `session-log-*.md` 에 기록 (**LLM 호출 없음** — sync 파일 쓰기만) | 30s |

## MCP 툴 (Claude 가 호출)

플러그인은 MCP 서버 `t` 로 등록되며, Claude 는 아래 7개 툴을 사용 가능:

| 툴 | 역할 |
|---|---|
| `wiki_add` | 새 페이지 1개 생성 (중복 slug 시 거부) |
| `wiki_ingest` | 페이지 생성 또는 기존 페이지에 append merge, `[[link]]` 자동 추출 |
| `wiki_query` | 키워드·태그·카테고리로 페이지 검색 (벡터 임베딩 없음) |
| `wiki_list` | 전체 페이지 카테고리별 목록 |
| `wiki_read` | 특정 페이지 원본 |
| `wiki_delete` | 페이지 삭제 |
| `wiki_lint` | orphan/stale/broken-ref/oversized/low-confidence 점검 |

## 저장 레이아웃

Claude 가 페이지를 추가하면 프로젝트 루트에 `.wiki/` 가 생성된다.

```
.wiki/
├── index.md              # 자동 유지되는 카탈로그 (카테고리별)
├── log.md                # append-only 연산 로그
├── environment.md        # project-memory 연동 (현재는 dead — 향후 재활성화)
├── .config.json          # 설정 (선택)
├── .wiki-lock            # 쓰기 동시성 제어 파일락
└── <slug>.md             # 개별 페이지 (YAML frontmatter + 본문)
```

페이지 파일 예:

```yaml
---
title: "JWT 인증 흐름"
tags: ["auth", "jwt"]
created: 2026-04-24T11:30:00.000Z
updated: 2026-04-24T11:30:00.000Z
sources: []
links: ["token-refresh-flow"]
category: architecture
confidence: medium
schemaVersion: 1
---

# JWT 인증 흐름
...
```

## 설정 (`.wiki/.config.json`)

선택사항. 없으면 기본값 사용.

```json
{
  "autoCapture": true,
  "staleDays": 30,
  "maxPageSize": 10240
}
```

| 키 | 기본 | 설명 |
|---|---|---|
| `autoCapture` | `true` | Stop 훅에서 세션 메타 자동 캡처 여부 |
| `staleDays` | `30` | `wiki_lint` 에서 stale 판정 기준 일수 |
| `maxPageSize` | `10240` | 페이지당 바이트 상한 (lint 경고) |

자동 캡처를 끄고 싶으면:

```json
{ "autoCapture": false }
```

## 카테고리

페이지 `category` 필드는 다음 중 하나 (Claude 가 내용에 맞게 선택):

`architecture`, `decision`, `pattern`, `debugging`, `environment`, `session-log`, `reference`, `convention`

## Cross-reference

페이지 본문에 `[[페이지-슬러그]]` 로 다른 페이지 참조. `wiki_ingest` 가 `links` frontmatter 에 자동 추출하고 `wiki_lint` 가 끊긴 참조를 잡는다.

## Git 관리

`.wiki/` 를 커밋할지는 프로젝트 정책:

- **개인 지식** → 사용자가 프로젝트 `.gitignore` 에 `.wiki/` 추가
- **팀 공유 지식** → 그대로 커밋

## 제약

- **벡터 임베딩 없음** — 키워드 + 태그 매칭만
- **LLM 호출 없음** (auto-capture) — 파일 쓰기만 수행, 요약/큐레이션은 다음 세션에서 Claude 가 수동으로
- 페이지는 프로젝트의 `.wiki/` 에 저장 — 플러그인 자체엔 데이터 없음

## 개발자 (MCP 재빌드)

```bash
cd _build
pnpm install
node build-mcp-server.mjs
```

출력: `bridge/mcp-server.cjs` (MCP 서버) + `bridge/session-hooks.cjs` (훅 스크립트가 require).
