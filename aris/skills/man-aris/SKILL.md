---
name: man-aris
description: ARIS 스킬 매뉴얼. 사용 가능한 모든 스킬의 역할과 사용 시점을 안내. "어떤 스킬 써야 해?", "스킬 목록", "man aris", "help aris" 등의 요청 시 사용.
argument-hint: [질문 또는 키워드]
allowed-tools: Read
---

# ARIS Skills Manual

ARIS (Autonomous Research In Sleep) 사용 가능한 스킬 목록입니다.
사용자에게 각 스킬의 역할과 언제 사용해야 하는지를 안내합니다.

---

## Literature Discovery (lit-*)

문헌 검색 및 신규성 검증 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `lit-arxiv` | arXiv에서 학술 논문 검색, 다운로드, 요약 | 최신 프리프린트를 찾거나 특정 arXiv 논문을 다운로드할 때 |
| `lit-survey` | Zotero, Obsidian, 로컬 PDF, arXiv, Semantic Scholar 통합 문헌 검색 | 여러 소스를 한번에 훑어 종합적인 문헌 조사가 필요할 때 |
| `lit-semantic-scholar` | Semantic Scholar API로 출판된 학술지/학회 논문 검색 | IEEE, ACM 등 출판된 논문의 인용수/베뉴 메타데이터가 필요할 때 |
| `lit-novelty-check` | 다중 소스 검색으로 연구 아이디어의 신규성 검증 | 아이디어 구현 전 기존 연구와 중복되는지 확인할 때 |
| `lit-comm-review` | 통신 분야(무선, 5G/6G, Wi-Fi, 빔포밍 등) 특화 문헌 조사 | 통신/네트워킹 도메인 논문이 필요할 때 |

---

## Idea Generation

연구 아이디어 발굴 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `idea-creator` | 문헌 갭에서 연구 아이디어 생성 및 순위 매기기 | 넓은 연구 방향에서 구체적인 publishable 아이디어를 뽑아낼 때 |
| `idea-discovery` | lit-survey → idea-creator → lit-novelty-check → research-review → research-refine-pipeline 전체 파이프라인 | 빈 상태에서 시작하여 검증된 아이디어까지 자동으로 도달하고 싶을 때 |

---

## Research Refinement & Planning

연구 제안서 정제 및 실험 계획 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `research-refine` | 모호한 연구 방향을 문제 기반 방법론으로 정제 (GPT-5.4 반복 리뷰) | 아이디어는 있지만 기술적 경로가 불명확할 때 |
| `research-refine-pipeline` | research-refine + experiment-plan 원샷 파이프라인 | 방법론 정제와 실험 계획을 한번에 끝내고 싶을 때 |
| `research-review` | Codex MCP를 통한 연구 제안서 심층 비평 리뷰 | 외부 관점의 비판적 피드백이 필요할 때 |
| `experiment-plan` | 정제된 제안서를 claim-driven 실험 로드맵으로 변환 | 방법론이 확정되었고, 어떤 실험을 어떤 순서로 할지 정해야 할 때 |
| `ablation-planner` | Ablation study 설계 (Codex 리뷰어 관점 + Claude 구현 가능성) | 메인 결과가 나왔고, 논문 제출 전 ablation이 필요할 때 |
| `result-to-claim` | 실험 결과가 지지하는 주장을 판단하고 다음 액션 라우팅 | 실험이 끝났고, 결과로 어떤 주장을 할 수 있는지 판단할 때 |

---

## Paper Writing & Production

논문 작성 및 컴파일 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `paper-plan` | 연구 내러티브에서 섹션별 논문 아웃라인 생성 | 논문 작성 전 구조를 잡을 때 |
| `paper-write` | 아웃라인에서 섹션별 LaTeX 논문 초안 작성 | 아웃라인이 준비되었고 본문을 작성할 때 |
| `paper-compile` | latexmk로 LaTeX → PDF 컴파일, 에러 자동 수정 | LaTeX 소스를 PDF로 빌드할 때 |
| `paper-writing` | paper-plan → paper-figure → paper-write → paper-compile → auto-paper-improvement-loop 전체 파이프라인 | 내러티브에서 제출 가능한 PDF까지 한번에 생성하고 싶을 때 |

---

## Figures, Visuals & Presentations

시각 자료 생성 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `paper-figure` | 실험 데이터(JSON/CSV)에서 출판 품질 matplotlib 그래프 및 LaTeX 테이블 생성 | 실험 결과를 논문용 그래프/테이블로 만들 때 |
| `paper-illustration` | Gemini 기반 다단계 AI 일러스트 (아키텍처 다이어그램, 컨셉 아트) | 논문에 넣을 방법론 그림이나 개념 일러스트가 필요할 때 |
| `paper-poster` | 논문에서 학회 포스터 생성 (LaTeX → A0/A1 PDF + PPTX + SVG) | 학회 포스터 세션 준비할 때 |
| `paper-slides` | 논문에서 발표 슬라이드 생성 (Beamer → PDF + PPTX) | 학회 발표 준비할 때 |
| `mermaid-diagram` | 20+ 종류의 Mermaid 다이어그램 생성 및 문법 검증 | 플로우차트, 시퀀스 다이어그램 등 구조도가 필요할 때 |
| `pixel-art` | 픽셀아트 SVG 일러스트 생성 | README나 문서에 넣을 귀여운 비주얼이 필요할 때 |

---

## Autonomous Review Loops

자동 리뷰 및 개선 반복 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `auto-review-loop` | Codex MCP(GPT-5.4) 기반 다중 라운드 자율 리뷰 루프 | 논문/연구를 외부 리뷰어가 통과시킬 때까지 자동 개선하고 싶을 때 |
| `auto-review-loop-llm` | OpenAI 호환 LLM API 기반 자율 리뷰 루프 | Codex MCP 대신 다른 LLM 프로바이더를 쓰고 싶을 때 |
| `auto-review-loop-minimax` | MiniMax API 기반 자율 리뷰 루프 | MiniMax API 접근이 있을 때 |
| `auto-paper-improvement-loop` | GPT-5.4 리뷰 2라운드 → 수정 → 재컴파일 자동 반복 | 생성된 논문을 자동으로 다듬어 제출 품질까지 올리고 싶을 때 |

---

## Theory & Mathematics

수학적 증명 및 수식 유도 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `proof-writer` | 엄밀한 수학적 증명 작성, 증명 가능 여부 라벨링 | 논문에 넣을 정리/보조정리 증명이 필요할 때 |
| `formula-derivation` | 수식 구조화 및 단계별 LaTeX 유도 | 산재된 수학적 노트를 일관된 유도 과정으로 정리할 때 |

---

## Grant Writing

연구비 제안서 작성 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `grant-proposal` | 다국가 펀딩 기관(KAKENHI, NSF, NSFC, ERC, DFG 등) 대상 제안서 초안 | 연구 아이디어를 연구비 신청서로 만들 때 |

---

## Post-Submission

제출 후 대응 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `rebuttal` | 리뷰어 반박문 작성 (출처/약속/커버리지 안전 게이트 포함) | 논문 리뷰를 받았고 반박문을 작성해야 할 때 |

---

## Infrastructure

인프라 및 프로파일링 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `system-profile` | py-spy, nvitop, nsys 등으로 스크립트/프로세스/GPU 프로파일링 | 코드 성능 병목을 찾거나 GPU 활용도를 분석할 때 |

---

## Meta

ARIS 자체 최적화 스킬.

| 스킬 | 설명 | 언제 사용? |
|---|---|---|
| `meta-optimize` | ARIS 사용 로그 분석 후 SKILL.md 최적화 제안 | ARIS 스킬 자체의 성능을 개선하고 싶을 때 |

---

## Quick Reference: 워크플로우별 스킬 체이닝

```
Workflow 1 (아이디어 발견):
  lit-survey → idea-creator → lit-novelty-check → research-review → research-refine-pipeline
  축약: idea-discovery

Workflow 2 (자동 리뷰 루프):
  auto-review-loop (반복: 리뷰 → 수정 → 재리뷰)

Workflow 3 (논문 작성):
  paper-plan → paper-figure → paper-write → paper-compile → auto-paper-improvement-loop
  축약: paper-writing

Workflow 4 (리뷰 반박):
  rebuttal
```

---

$ARUGMENTS