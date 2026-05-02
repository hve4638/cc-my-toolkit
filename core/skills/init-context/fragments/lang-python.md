---
name: lang-python
description: Python project rules (uv enforced)
condition: Primary language is Python (pyproject.toml / requirements.txt / many *.py files).
---

## Python

- Use `uv` as the only package manager. Do not use `pip`, `poetry`, or `conda`.
- If not installed: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Project init: `uv init <project-name>`
- Add dependency: `uv add <package>`
- Run script: `uv run <script>`
