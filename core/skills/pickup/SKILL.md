---
name: pickup
disable-model-invocation: true
---

<pickup_instruction>
# pickup

Pick a previous handoff folder, read `INDEX.md` first, and show the user a brief summary only. Do not proceed with the work itself until the user explicitly directs you to.

---

## Flow

### 1. Scan candidates
Enumerate the direct subfolders of `.agent-memory/handoff/`. Exclude `_archive/`.

- Lexicographic sort on folder names suffices to find the latest (timestamps are the prefix, so chronological order follows).
- Do not use symlinks or pointer files (cross-platform portability).

### 2. Select
- 0 candidates → tell the user there is nothing to pick up, and stop.
- 1 candidate → load immediately (skip confirmation).
- 2+ candidates → present them newest-first and ask the user to choose.

#### Candidate listing format
```
1. 2026-04-25T1610_new-work
2. 2026-04-25T1430_handoff-plugin-design
```

Accept either a numeric choice or a partial name match.

### 3. Load
- Read the selected folder's **`INDEX.md` first**.
- Follow INDEX's entry-point guidance and dependency ordering to walk the `NN-*.md` documents.
- Treat the loaded content as the working base for the current session.

### 4. Archive
After confirming a successful load, move the folder into `.agent-memory/handoff/_archive/`.

- Purpose: prevent the same handoff from re-surfacing on a later call.
- Do not move on failure or abort (atomicity).
- Create `_archive/` if it does not exist.
- Example: `mv .agent-memory/handoff/<folder> .agent-memory/handoff/_archive/`.

---

## "What's next" answer rule

When the user asks something like "what's next", "where do I pick up", or "continue from where" without naming a target, **draw only from the "Next moves" section of the file marked as `current context` in INDEX.md**.

- If another file shows a "Next moves" entry but is `[done]`, do not propose it — the work is already finished.
- If the current context is `none (session closed)`, answer "no active work to resume" and ask the user for fresh direction.
- If the handoff is missing the current-context marker (legacy), ask the user which file to continue — never guess.

This works together with the no-auto-execute rule at the top of the skill: show the summary, then apply the rule above only after the user explicitly asks for the next move.

---

## Re-load policy

Archived handoffs are excluded from candidate scanning by default. (Except when the user mentions one directly.)

---

## Boundaries

- handoff — the saving counterpart.
- pickup — the restoring counterpart.
- Does not interfere with other session-continuity mechanisms.
</pickup_instruction>

$ARGUMENTS
