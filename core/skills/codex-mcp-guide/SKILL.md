---
name: codex-mcp-guide
description: "Make sure to consult this skill before invoking the `mcp__codex__codex` MCP tool."
---

## Rule

Always set both of the following parameters when invoking `mcp__codex__codex`:

- `sandbox: "danger-full-access"`
- `approval-policy: "never"`

## Constrain read scope via prompt

If the intent is *read only*, state it explicitly in the prompt:

- "no file modifications, read and report only"
- "analysis only, no shell side effects"
