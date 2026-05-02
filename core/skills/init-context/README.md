# init-context

CLAUDE.md 를 자동 생성·갱신하는 스킬. `/init-context` 로 호출.

산출물:
- `~/.claude/CLAUDE.md` (Global 모드 — `cwd === $HOME` 시 자동 진입)
- `<cwd>/CLAUDE.md` (Project 모드)

## 설계 의도

일반론으로 가득한 거대 CLAUDE.md 를 자동 생성하지 않는다. 합성 입력 3축:

1. **마스터 골격** (`AGENTS.skeleton.md`) — XML 태그 13개의 순서·자리만 정의. OMC CLAUDE.md 구조 차용
2. **플러그인 partial** (`<plugin>/docs/AGENTS.partial.md`) — 활성 플러그인이 자기 컨텐츠를 마스터 태그에 채움
3. **fragment 인터뷰** (`fragments/rule-*.md`, `fragments/lang-*.md`) — 사용자가 매번 선택하는 메소드·언어 규약

각 입력은 명확히 분리된 책임. 사용자가 결정한 것만 합성한다. 빠진 게 있으면 다음 호출에서 추가한다 (Simplicity First).

대상 독자는 같은 환경에서 다음 세션을 시작할 미래의 Agent.

## 모드 결정

`process.cwd() === os.homedir()` 정확 일치 → 자동 Global. 그 외 → AskUserQuestion 으로 사용자에게 Global/Project 선택을 받는다.

## fragment 작성 규약

각 fragment 는 frontmatter 로 다음 키를 둔다.

스킬이 읽는 키:

- `name` (필수) — fragment 식별자. 파일명 (확장자 제외) 과 같다
- `description` (필수) — 사용자에게 한 줄로 보여줄 라벨
- `condition` (선택) — fragment 가 후보로 올라가기 위한 조건. **현재 구현은 condition 무시** (rule 인터뷰는 전체 표시). 미래 자동 매칭 도입 시 활용
- `conflicts_with` (선택) — 정책 충돌하는 다른 fragment 이름 배열. 예: `conflicts_with: [rule-tdd]`. 동시 선택 시 AskUserQuestion 으로 사용자 결정

스킬이 무시하는 키:

- `source` — 외부 출처 / 라이선스 표기 (예: `https://example.com/repo (MIT License)`)

파일명 prefix 카테고리:

- `lang-*` — 언어/런타임 환경 규약
- `rule-*` — 코딩 규율, 메소드

새 카테고리 prefix 가 필요하면 fragment 를 추가하기 전에 SKILL 의 인터뷰·합성 절차를 먼저 확장한다.

## plugin partial 작성 규약

각 플러그인이 `<plugin>/docs/AGENTS.partial.md` 를 가지면 init-context 가 자동 수집·합성. 형식:

```xml
<delegation_rules>
... 컨텐츠 ...
</delegation_rules>

<agent_catalog>
... 컨텐츠 ...
</agent_catalog>
```

규약:

- 마스터 skeleton (`AGENTS.skeleton.md`) 의 13개 태그 중 자기가 채울 것만 둔다
- 안 채우는 태그는 partial 에 두지 않는다 (skeleton 에 placeholder 주석으로 자리 보존됨)
- nested 태그·속성·CDATA 는 지원 안 함 (단순 컨벤션)
- 한국어 워킹 카피 `AGENTS.partial.ko.md` 가능 — 영문 partial 만 실제 합성에 사용됨

마스터 skeleton 의 13개 태그 (OMC 구조 따라감):

```
operating_principles, delegation_rules, model_routing,
agent_catalog, tools, skills, team_pipeline,
verification, execution_protocols, commit_protocol,
hooks_and_context, cancellation, worktree_paths
```

## 규율 분류 정책

| 종류 | 위치 | 적용 |
|---|---|---|
| **메소드 규율** (TDD, Karpathy 등) | `fragments/rule-*.md` | 인터뷰 opt-in (사용자가 매번 선택) |
| **플러그인-특화 규율** (inlay 등) | `<plugin>/docs/AGENTS.partial.md` 의 적절한 태그 | 플러그인 활성 시 자동 주입 |

판정 기준 — **사용자가 끄고 싶을 수 있는가?**
- Yes (메소드 선택지) → fragment 인터뷰
- No (플러그인 사용 시 무조건) → partial 자동 주입

## 멱등성

산출물 마커 블록에 입력 해시 (SHA-256) 를 넣어 같은 입력에는 같은 결과 보장.

```
<!-- HVE:START -->
<!-- HVE:VERSION:1 -->
<!-- HVE:GENERATED-AT:... -->
<!-- HVE:PLUGINS: ... -->
<!-- HVE:HASH:sha256-... -->
... 본문 ...
<!-- HVE:END -->
```

해시 입력 = 활성 플러그인 + partial 본문 + 인터뷰 선택. 재실행 시 해시 일치 → write skip.

블록 위치:
- 마커 없음 (최초) → 파일 최상단 prepend
- 마커 있음 (갱신) → 마커 위치 보존, 안만 교체. 마커 바깥 사용자 컨텐츠 보존

## 다른 도구와의 경계

- `/init` (Claude Code 빌트인) — 자동 분석으로 일반적인 CLAUDE.md 생성. init-context 는 명시적 합성 + 인터뷰 + 멱등 갱신에 무게중심
- MEMORY.md — 사용자·프로젝트 지속 메모리. init-context 산출물은 환경 규약, 메모리 아님
- `/handoff` (common 스킬) — 세션 단위 인계. init-context 는 환경 규약 셋업

## 폴더 구조

```
init-context/
├── SKILL.md                      # 영문 (정본)
├── SKILL.ko.md                   # 한국어 워킹 카피
├── README.md                     # 본 문서
├── REPORT.md                     # 설계 결정 기록
├── AGENTS.skeleton.md            # 마스터 골격 (13개 태그)
├── fragments/                    # 인터뷰 fragment (영문)
│   ├── lang-*.md
│   └── rule-*.md
├── fragments-ko/                 # 한국어 워킹 카피
└── scripts/
    ├── detect-active-plugins.mjs # 활성 플러그인 + installPath 검출
    ├── detect-languages.mjs      # Project 모드 코드베이스 언어 탐색
    └── compute-input-hash.mjs    # SHA-256 (stdin JSON → hex)
```

외부 기여:

```
<plugin>/docs/
├── AGENTS.partial.md             # 영문 (정본)
└── AGENTS.partial.ko.md          # 한국어 워킹 카피 (선택)
```

> 한국어 워킹 카피 (`SKILL.ko.md`, `fragments-ko/`, `AGENTS.partial.ko.md`) 는 운영 디렉터리와 분리되어 스캔에 잡히지 않는다. 최종 동작에는 영문 산출물만 사용된다.
