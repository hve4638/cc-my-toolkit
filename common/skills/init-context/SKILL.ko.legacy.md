---
name: init-context
description: "프로젝트 전용 CLAUDE.md 를 생성한다. `${CLAUDE_PLUGIN_ROOT}/skills/init-context/fragments/` 의 모든 fragment 를 직접 스캔해 frontmatter (name, description, condition) 를 읽고, condition 을 코드베이스·환경 신호와 대조해 적용 후보를 추린다. 사용자 컨펌을 거쳐 합성·확정한다. 트리거 예: '/init-context', 'CLAUDE.md 만들어줘', '프로젝트 컨텍스트 초기화'. 명시 호출 전용. 자동 트리거 금지. 설계 의도와 fragment 작성 규약은 `${CLAUDE_PLUGIN_ROOT}/skills/init-context/README.md` 참조."
---

<init_context_instruction>
# init-context

탐색 → 매칭 → 컨펌 → 합성 → 충돌 검사 → 확정 6단계로 CLAUDE.md 를 만든다.

## 입력과 산출물

- fragment 소스: `${CLAUDE_PLUGIN_ROOT}/skills/init-context/fragments/*.md` 만 사용. 외부에서 새 fragment 를 만들지 않는다. SKILL 은 이 폴더를 매 호출마다 직접 읽는다 — fragment 이름을 SKILL 본문에 하드코딩하지 않는다.
- 중간 산출물: 각 산출물 경로의 `CLAUDE.draft.md`
- 최종 산출물: 프로젝트 루트의 `CLAUDE.md`. 멀티 언어 분배가 적용되면 서브디렉터리에도 추가 `CLAUDE.md` 가 생길 수 있다 (`lang-*` 특별 규약 참조).
- 백업 정책: 각 산출물 경로에 동일 적용. 기존 `CLAUDE.md` 가 있으면 6단계 직전에 같은 경로의 `CLAUDE.md.bak` 으로 이동 (덮어쓰기 금지). `CLAUDE.md.bak` 이 이미 있으면 사용자에게 어떻게 할지 묻는다.

## prefix 카테고리

- `lang-*` — 언어/런타임 환경 규약.
- `rule-*` — 코딩 규율, 가이드, 메소드.

SKILL 은 이 prefix 두 개로 합성 그룹 순서와 lang 특별 규약을 적용한다.

## 1. 탐색

`${CLAUDE_PLUGIN_ROOT}/skills/init-context/fragments/*.md` 를 모두 읽어 각 fragment 의 `condition` 을 수집한다. 그 condition 들이 공통으로 요구하는 신호 카테고리를 추려 한 번에 수집한다. 읽기 전용 도구만 사용한다.

신호 카테고리 (예시 — fragment condition 이 요구하는 만큼만 수집):

- 코드베이스 — 파일 확장자 분포, 매니페스트, 락파일, 디렉터리 구조
- 활성 환경 — 현재 사용 가능한 SKILL 목록, 활성 플러그인

수집 결과를 5줄 이내로 요약해 사용자에게 보여준다.

## 2. 매칭

각 fragment 를 다음 셋 중 하나로 분류한다.

- 부합 — `condition` 이 신호를 만족 → 자동 후보
- 미부합 — `condition` 이 신호와 명백히 어긋남 → 자동 제외 (사용자에게 묻지 않음)
- 사용자 컨펌 — 다음 중 하나:
  - `condition` 키가 없는 fragment (항상 사용자 의사로 결정되는 부류)
  - `condition` 매칭 결과가 모호한 경우

### lang-* 특별 규약

- `lang-*` 은 코딩 위주 프로젝트일 때만 후보가 된다 (그 외엔 자동 제외).
- 부합한 `lang-*` 가 둘 이상이면 코드베이스의 언어 분포를 본다.
  - 비율이 비등하고 두 언어가 코드베이스 전반에 퍼져있다 → 모두 root CLAUDE.md 에 합성한다.
  - 한 언어가 지배적이고 비지배 언어가 특정 서브디렉터리에 모여있다 → 지배 언어는 root CLAUDE.md 에, 비지배 언어는 그 서브디렉터리의 CLAUDE.md 에 분리 합성한다.
  - 위 두 케이스에 명확히 들어맞지 않으면 사용자에게 분배 방식을 1회 질문한다.

이 분기로 산출물이 N 개 (root 1 + 서브디렉터리 0..M) 가 될 수 있다. 4~6 단계는 각 산출물에 대해 동일하게 반복한다.

## 3. 컨펌

부합 + 불확실 fragment 를 표 형태로 사용자에게 한 번에 묶어 보여주고, 각각 적용할지 묻는다. 표는 fragment 의 `name`, `description`, 매칭 상태, 매칭 근거를 컬럼으로 가진다.

미부합으로 자동 제외된 fragment 는 표에 넣지 않되, 결과 요약 줄에 "(N 개 자동 제외)" 만 명시.

사용자가 일부만 토글하거나 추가/제거하면 그 결과로 최종 선택 집합 확정.

## 4. 합성

선택된 fragment 를 정해진 순서로 이어붙여 `CLAUDE.draft.md` 를 작성한다.

- **fragment 본문은 변형하지 않는다.** frontmatter (`---` 블록) 만 제거하고 본문을 그대로 옮긴다. 이렇게 해야 fragment 갱신 시 CLAUDE.md 재합성이 idempotent 해진다.
- 그룹 순서: `lang-*` → `rule-*`. 그룹 내 정렬: 파일명 알파벳 순.
- 이어붙일 때 fragment 사이에 `\n` 1개만 넣는다. 공백 정규화는 6단계에서 한다.
- 헤더 충돌은 5단계에서 잡는다. 이 단계에서는 그대로 둔다.
- 상단 머리말: 파일 첫 줄에 `# CLAUDE.md` 을 넣는다.

## 5. 충돌 검사

`CLAUDE.draft.md` 를 다시 읽어 모순을 찾는다.

- 명령 충돌 — 한 fragment 가 어떤 도구를 강제하는데 다른 fragment 가 다른 도구의 예제를 사용하는 등
- 톤 충돌 — 한 fragment 는 엄격한 가드레일, 다른 fragment 는 권고 수준인데 같은 축에서 충돌하는 경우
- 내용 중복 — 두 fragment 가 같은 주제를 다른 표현으로 반복하는 경우

발견된 충돌은 사용자에게 1회만 질문해 결정한다 (자동 결정 금지). 충돌이 없으면 6단계로.

---

## 6. 확정

1. 기존 `CLAUDE.md` 가 있으면 `CLAUDE.md.bak` 으로 이동 (`CLAUDE.md.bak` 이 이미 있으면 사용자에게 처리 방법 질문).
2. `CLAUDE.draft.md` 의 공백을 정규화한다: 연속된 빈 줄은 1개로 압축, 파일 끝은 newline 1개로 통일.
3. `CLAUDE.draft.md` 를 `CLAUDE.md` 로 rename.
4. 사용자에게 결과를 1줄로 보고: 어떤 fragment 가 포함됐는지, 백업 파일 경로.

## 빈 결과 처리

매칭 결과 부합·불확실 fragment 가 0 개이면, 합성하지 않고 사용자에게 한 줄로 보고한다. 빈 CLAUDE.md 를 만들지 않는다.

</init_context_instruction>

$ARGUMENTS
