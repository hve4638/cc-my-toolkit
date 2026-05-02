---
name: skillify
disable-model-invocation: true
argument-hint: "[선택사항: 만들 스킬의 짧은 설명 또는 슬러그]"
---

<skillify_instruction>
# skillify

skillify 는 이 프로젝트의 스킬 작성 규칙 모음이다. 신규 스킬 작성·기존 스킬 검토 양쪽에서 이 규칙을 기준으로 한다.

작성 절차 (인터뷰·슬러그 결정·검토·번역·보고) 는 [SKILLIFY-WORKFLOW.ko.md](./SKILLIFY-WORKFLOW.ko.md) 참조.

---

## Frontmatter

| 시나리오 | `disable-model-invocation` |
|---|---|
| 가드레일 (description 매칭으로 auto-trigger) | (없음) |
| 수동 호출 전용 (`/<slug>` 로만 호출) | `true` |

호출 시 인자를 받을 의도면 `argument-hint: "[설명]"` 추가.

---

## Description

다음 7원칙을 모두 충족.

1. `Imperative, 미래 Agent 대상` — `"Use this skill when ..."`, `"Make sure to consult ..."`. 평서문 (`"This skill does X"`) 금지.
2. `Intent 서술` — Agent 가 *하려는 작업* 으로. 스킬 *내용물* 서술 (`"contains rules about X"`) 금지.
3. `Precision` — under/over-trigger 둘 다 실패. 트리거 카테고리를 정확히.
4. `WHY 명시` — 어떤 실패를 막는가. 패턴: `"Consult it to avoid {specific failure mode}"`.
5. `Distinctive` — 도구명·명령어·에러 메시지 중 최소 하나 포함.
6. `Length` — 100~200 words 권장, max 1024 chars. `<` `>` 금지.
7. `Generalize, don't overfit` — 구체 쿼리를 나열하지 않고 트리거 카테고리만.

### 강한 금지

- 대문자 `MUST` / `ALWAYS` / `NEVER` 를 누적해서 쓰지 않는다
- safety-net 절 (`"even when user doesn't ask ..."`) 을 넣지 않는다
- description 에 행동 룰을 포함하지 않는다

### description vs body 분담

- description = 트리거 매칭 진입로 + WHY
- body = 호출 후 행동

description 에 룰까지 포함하지 않는다.

### 예시

❌ description 에 룰까지 포함한 경우 (body 무의미):

```
"Use this skill when writing git rebase commands. The --no-edit flag is invalid for git rebase — omit it. Consult it to avoid an unknown switch error."
```

⭕ trigger + WHY 만 (body 가 룰 담당):

```
"Use this skill when writing or proposing `git rebase` commands. Consult it to avoid passing an invalid flag combination that aborts the rebase with an 'unknown switch' error."
```

---

## Body

### 본문에는 지시만

본문은 *지시* 와 *지시의 대상* (산출물·입력·작동 객체) 만 담는다. 다음은 본문에 포함하지 않는다:

- 스킬 자체에 대한 메타 (audience·전제 환경·중요도)
- 불릿 뒤 `—` 으로 붙는 이유 부연
- 인접 도구 분류표
- 명령형 동사 없는 명사구 나열

기본 골격 (가드레일형):

```yaml
---
name: <slug>
description: "..."
---

## Rule
<해야 할 것 / 하지 말 것>

## Not a violation
<이 룰이 적용되지 않는 정상 케이스 1~2개. 비우면 통째 생략>
```

다른 유형:

- 워크플로우형 (다단계 절차): `### Step 1...N`
- 메타형 (skill of skills, e.g. skillify, reflect): 워크플로우 + 원칙 + 경계 조합
- 참조형 (지식 저장): `## 분류` / `## 항목` — 룰보다 사실 위주

필요 시 추가:
- `## Reason` — 트레이드오프 또는 환경 전제
- `## 경계` — 인접 스킬과의 차이 (혼동 방지)

### 결정론 vs 판단 분리

본문에는 *판단이 필요한 부분* 만 담는다. *결정론적* 단계 (계산·고정 변환·정해진 절차) 는 분리:

- 코딩 스킬 → `scripts/<name>.{sh,mjs,py}` 로 빼고 본문에서 호출 지시
- 매뉴얼·문서 스킬 → `assets/<name>.md` 같은 고정 템플릿으로 빼고 본문에서 참조 지시

### 본문 디시플린

- bullet 시작 단어에는 `**bold**` 를 사용하지 않는다
- 행동을 바꾸는 핵심 룰에만 bold 를 제한적으로 사용한다
- 행동 처방 ("X 를 하지 마라") 을 구조적 가드레일 ("X 를 했다면 명시한다") 로 우회 표현할 수 있으면 가드레일 쪽으로 작성한다.

</skillify_instruction>

$ARGUMENTS
