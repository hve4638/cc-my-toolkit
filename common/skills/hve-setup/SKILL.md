---
name: hve-setup
description: "Install Codex CLI and register MCP server."
disable-model-invocation: true
allow_implicit_invocation: false
---

# HVE Setup

사용자의 개발 환경에 필요한 도구를 설치하고 설정합니다.

## 실행 순서

아래 단계를 순서대로 실행하세요. 각 단계의 결과를 사용자에게 보고합니다.

### Step 1: Codex CLI 확인

```bash
codex --version
```

- 버전이 출력되면 → "Codex CLI 설치됨 (버전: X.X.X)" 보고 후 Step 3으로 이동
- 명령어를 찾을 수 없으면 → Step 2 진행

### Step 2: Codex CLI 설치

```bash
npm install -g @openai/codex
```

설치 완료 후 `codex --version`으로 설치 확인.

### Step 3: Codex MCP 서버 등록

```bash
claude mcp add codex -s user -- codex mcp-server
```

- 이미 등록되어 있으면 덮어쓰기 여부를 사용자에게 확인
- 등록 성공 시 "Codex MCP 서버 등록 완료" 보고

### Step 4: 결과 요약

설치/설정 결과를 요약 보고:

```
[hve-setup 결과]
- Codex CLI: ✅ (버전)
- Codex MCP: ✅ (user 스코프)
```

실패한 항목이 있으면 원인과 수동 해결 방법을 안내합니다.
