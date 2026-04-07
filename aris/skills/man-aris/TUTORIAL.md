# ARIS Tutorial

ARIS 스킬을 실제로 어떤 상황에서 사용하는지 시나리오별로 안내합니다.

---

## 1. 논문 쓸 주제를 찾고 싶을 때

```
/idea-discovery "federated learning for edge devices"
```

내부적으로 `lit-survey → idea-creator → lit-novelty-check → research-review → research-refine-pipeline`이 순차 실행됩니다. 끝나면 `IDEA_REPORT.md`와 `FINAL_PROPOSAL.md`가 생성됩니다.

단계별로 직접 제어하고 싶다면:

```
/lit-survey "federated learning"          # 1) 문헌 조사
/idea-creator "federated learning"        # 2) 아이디어 생성
/lit-novelty-check "proposed idea"        # 3) 신규성 검증
```

---

## 2. 아이디어를 구체적인 방법론으로 다듬고 싶을 때

```
/research-refine "problem description | vague approach"
```

GPT-5.4가 리뷰어 역할로 반복 피드백합니다 (최대 5라운드, 점수 9 이상까지).

실험 계획까지 한번에 이어가려면:

```
/research-refine-pipeline "problem | approach"
```

---

## 3. 논문을 작성하고 싶을 때

```
/paper-writing "narrative-report.md"
```

`paper-plan → paper-figure → paper-write → paper-compile → auto-paper-improvement-loop`이 자동 실행되어 제출 가능한 PDF가 나옵니다.

단계별로:

```
/paper-plan "topic — venue: NeurIPS"      # 아웃라인
/paper-figure "results.json"              # 그래프/테이블
/paper-write "ICLR"                       # LaTeX 본문
/paper-compile "paper/"                   # PDF 컴파일
```

---

## 4. 논문을 자동으로 리뷰하고 개선하고 싶을 때

```
/auto-review-loop "paper/ — difficulty: hard"
```

외부 LLM이 리뷰 → 수정 → 재리뷰를 반복합니다. Codex MCP 없이 다른 LLM을 쓰려면:

```
/auto-review-loop-llm "paper/"
```

---

## 5. 리뷰어 반박문을 작성해야 할 때

```
/rebuttal "paper/ — reviews.txt"
```

출처/약속/커버리지 안전 게이트를 거쳐 근거 기반 반박문을 생성합니다.

---

## 6. 연구비 신청서를 쓰고 싶을 때

```
/grant-proposal "research direction — KAKENHI"
/grant-proposal "research direction — NSF"
```

KAKENHI, NSF, NSFC, ERC, DFG 등 주요 펀딩 기관 형식을 지원합니다.

---

## 7. 발표 자료를 준비해야 할 때

```
/paper-poster "paper/ — venue: ICML"      # 학회 포스터
/paper-slides "paper/ — 15min"            # 발표 슬라이드
```

---

## 8. 수학적 증명/수식이 필요할 때

```
/proof-writer "Theorem: ..."              # 증명 작성
/formula-derivation "scattered notes"     # 수식 유도 정리
```

---

## 9. 특정 논문을 찾고 싶을 때

```
/lit-arxiv "attention mechanism"           # arXiv 프리프린트
/lit-semantic-scholar "topic — year: 2024-" # 출판된 학술지/학회 논문
/lit-comm-review "beamforming"             # 통신 분야 특화
```

---

## 10. 다이어그램/일러스트가 필요할 때

```
/mermaid-diagram "system architecture flowchart"
/paper-illustration "method overview"
/pixel-art "cute robot mascot"
```
