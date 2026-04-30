---
name: rule-karpathy
description: Karpathy LLM coding guardrails
condition: Coding-heavy project (source code dominant). Skip for docs / data-analysis projects — adds noise.
source: https://github.com/forrestchang/andrej-karpathy-skills (MIT License)
---

## LLM Coding Guardrails (Karpathy)

Don't assume. Don't hide confusion. Surface tradeoffs. For trivial tasks, use judgment.

### 1. Think Before Coding — don't assume, don't hide confusion, surface tradeoffs

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First — minimum code that solves the problem, nothing speculative

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and 50 would do, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes — touch only what you must, clean up only your own mess

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports / variables / functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution — define success criteria, loop until verified

Transform imperative tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [step] → verify: [check]
2. [step] → verify: [check]
3. [step] → verify: [check]
```

Strong success criteria let the LLM loop independently. Weak criteria ("make it work") force constant clarification.
