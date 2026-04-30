# init-context

프로젝트 전용 CLAUDE.md 를 fragment 단위로 합성하는 SKILL.

명시 호출 전용 (`/init-context`). 자동 트리거 후보가 아니다.

## 설계 의도

일반론으로 가득한 거대 CLAUDE.md 를 자동 생성하지 않는다. 각 fragment 가 자기 `condition` 을 명시하고, SKILL 은 그것을 코드베이스·환경 신호와 대조해 후보를 만든다. 사용자가 최종 결정한 것만 합성한다. 빠진 게 있으면 다음 호출에서 추가한다 (Simplicity First).

대상 독자는 같은 프로젝트에서 다음 세션을 시작할 미래의 Agent (사람 아님).

## fragment 작성 규약

각 fragment 는 frontmatter 로 다음 키를 둔다.

SKILL 이 읽는 키:

- `name` (필수) — fragment 식별자. 파일명 (확장자 제외) 과 같다.
- `description` (필수) — 사용자에게 한 줄로 보여줄 라벨.
- `condition` (선택) — fragment 가 후보로 올라가기 위한 조건. LLM 이 자연어로 해석하는 신호 매칭 표현. 신호가 condition 과 명백히 어긋나면 자동 제외된다 (사용자에게 묻지도 않음). condition 키가 없는 fragment 는 항상 사용자 컨펌 후보로 처리된다 (예: TDD 적용 여부처럼 사용자 의사로만 결정되는 부류).

SKILL 이 무시하는 키 (fragment 자체에 부가 정보 보존):

- `source` — 외부 출처 / 라이선스 표기 (예: `https://example.com/repo (MIT License)`). 외부에서 가져온 fragment 의 의무 표기에 사용.

파일명 prefix 는 카테고리로 쓴다.

- `lang-*` — 언어/런타임 환경 규약.
- `rule-*` — 코딩 규율, 가이드, 메소드.

새 카테고리 prefix 가 필요해지면 fragment 를 추가하기 전에 SKILL 의 prefix 규약 (합성 순서, 특별 규약) 을 먼저 확장한다.

## 다른 도구와의 경계

- `/init` (Claude Code 빌트인) — 자동 분석으로 일반적인 CLAUDE.md 를 생성. init-context 는 condition 매칭 + 사용자 컨펌 + 재현 가능한 합성에 무게중심.
- MEMORY.md — 사용자·프로젝트 지속 메모리. init-context 의 산출물은 프로젝트 규약이지 메모리가 아니다.
- `/handoff` — 세션 단위 인계. init-context 는 1회성 셋업.

## 폴더 구조

```
init-context/
├── SKILL.md               # SKILL 본체 (영문)
├── README.md              # 본 문서 (설계 의도, fragment 작성 규약, 경계)
└── fragments/
    ├── lang-*.md          # 언어 규약
    └── rule-*.md          # 코딩 규율
```

> 작업 중에는 한국어 워킹 카피 (`SKILL.ko.md`, `fragments-ko/`) 가 함께 존재할 수 있다. 운영 디렉터리 (`fragments/`) 와 분리되어 SKILL 스캔에 잡히지 않는다. 최종 동작에는 영문 산출물만 사용된다.
