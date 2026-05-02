---
name: handoff
disable-model-invocation: true
---

<handoff_instruction>
# handoff

Split the current session's work context by task and store each unit under `.agent-memory/handoff/`. Write so a zero-context next-session Claude can resume immediately (not a human-style summary).

---

## Storage layout

- Path: `.agent-memory/handoff/YYYY-MM-DDThhmm_<title-slug>/`
- Title slug: kebab-case, up to 40 characters, Korean allowed. Use `mixed` when the session is genuinely heterogeneous.
- File names: `INDEX.md` plus `NN-<slug>.md` (two-digit zero-padded, e.g., `01-foo.md`).
- Accumulation: never overwrite — every call creates a new folder.
- Timestamp: obtain current time via `date +"%Y-%m-%dT%H%M"` or equivalent.

---

## Interaction protocol

A single invocation does not save immediately. **Only stages 1–2 are coordinated with the user**; once the grouping is confirmed, **stages 3–5 run automatically**.
During stages 1–2, expect repeated instructions ("exclude this", "expand that") and adjust on the fly.

### 1. Enumerate everything (user collaboration)
List **every** task context performed or discussed in the current session. The goal is to miss nothing.

### 2. Propose groupings (user collaboration)
Cluster by cohesion and present the proposal. Merge, split, drop, or add under the user's direction.

**Once the user confirms the grouping, stages 3–5 execute automatically without further confirmation.**

### 3. Auto-decide the title
Auto-select one slug that captures the session's dominant theme. Use `mixed` when it is truly heterogeneous. No user-approval step.

### 4. Auto-write the documents
Auto-write the body of each task document. Empty sections from the recommended list are auto-omitted.

### 5. Auto-save
Write immediately to `.agent-memory/handoff/<timestamp>_<title>/`. No separate final-approval step.

---

## Splitting principle

- No fixed section structure → split by task cohesion.
- Cohesive tasks = one file. Genuinely independent tasks = separate files.
- Right sizing check: "Is each file understandable on its own to a zero-context next-session Claude?"

### Suggested sections per task document (loose, omit when empty)
- Intent — what the user was trying to do, and why
- Progress so far — chronological trace
- Decisions and reasoning — options / the choice / the reason (guards against rollback)
- Open issues — unresolved / blockers / awaiting answer
- Next moves — immediately executable actions. **Record only on the single task that was active at session end.** Never include this section on completed task files (prevents pickup from re-suggesting finished work).

### Writing rules
- No copy-pasted code blocks.
- Reference code as **file path + line numbers + intent** only.
- Capture "why it was done / where it stands / next move", not just "what was done".

---

## INDEX.md

Always generate. The next-session Claude's entry point.

- Task list (file name + one-line summary). Tag each entry with a `[done]` / `[active]` status marker. Exactly one `[active]` (or zero — when the session ends naturally).
- Priorities / dependencies
- Explicit guidance on where to begin reading
- Current context — name the single file marked `[active]`. **The sole source pickup uses to answer "what's next"**. If no active work, state `none (session closed)`.

---

## No filesystem exploration (soft rule)

Handoff curates only what the current session already knows. Prevents leaking information from outside the session context.

Exceptions (exploration allowed):
- Resolving an ambiguity or contradiction
- When the user explicitly instructs exploration

---

## Boundaries

- inlay — methodology guardrails for writing code
- handoff — inter-session context transfer (explicit invocation, one-shot)
- MEMORY.md — permanent project knowledge (automatic)

If a piece of handoff content belongs to permanent project knowledge, promote it to memory separately. Handoff itself is session-scoped.
</handoff_instruction>

$ARGUMENTS
