---
name: report-maker
description: ".report/ 내에 보고서를 작성할 때 참조해야 할 것"
---

<reportmaker_instructions>
작업 내역을 `./.report/{date}-{no}-{title}/` 에 보고서에 작성.
가장 최근 보고서가 기록하려는 작업 내역과 유사한 경우, 해당 보고서 내에 새로운 파일로 갱신할지를 사용자에게 물어볼 것

작성 규칙
- 디렉토리의 {date}는 YYYY-MM-DD 형식의 날짜
- 별도의 지시가 없거나 REPORT.md 파일이 없는 경우, 생성하는 파일명은 `REPORT.md` 로 고정.
- {no}는 해당 날짜의 보고서 번호(1부터 시작하는 정수, 날짜 변경 시 초기화)
- {title}은 보고서 제목을 간략하게 표현한 문자열 (소문자 알파뱃 + 하이픈)
- 추가한 리포트는 `./.report/INDEX.md` 에 인덱스 형태로 기록

작성 예시:
```
# 리포트 제목

> 분석일: YYYY-MM-DD HH:MM (반드시 시간, 분까지 명시)
> 우선순위: 높음/보통/낮음
> 이슈 요약: 한 줄로 간략하게
> 상태: 진행 중/완료/보류 (YYYY-MM-DD HH:MM 기준)

## ...

내용
```

</reportmaker_instructions>

$ARGUMENTS