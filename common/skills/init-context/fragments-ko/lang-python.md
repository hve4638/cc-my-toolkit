---
name: lang-python
description: Python 프로젝트 규약 (uv 강제)
condition: 주 언어가 Python (pyproject.toml / requirements.txt / *.py 다수 등).
---

## Python

- 패키지 매니저는 `uv` 만 사용한다. `pip`, `poetry`, `conda` 는 사용하지 않는다.
- 미설치 시: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- 프로젝트 초기화: `uv init <project-name>`
- 의존성 추가: `uv add <package>`
- 스크립트 실행: `uv run <script>`
