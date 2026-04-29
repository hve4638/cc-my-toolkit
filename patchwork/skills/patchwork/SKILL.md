---
name: patchwork
description: "Mandatory development methodology guardrail to load when writing, editing, refactoring, debugging, reviewing code or designing modules/architecture. Blocks agent failure modes — rewriting functions that already exist, rolling back code without reason, mismatching domain terms — through context preservation (context capsules, intent comments, DDD domain glossary). Reference immediately on any new code, debugging, refactor, review, or module design request."
---

<patchwork>

# patchwork

## Purpose

Discipline and guardrails for an agent's code work. Pin codebase context next to the code so the agent does not pay the cost of rediscovering truth on every task.

## When to apply

Apply on writing, editing, refactoring, debugging, reviewing code, and designing modules. Effect is largest on mid-sized or larger codebases and on long-running work.

## Pre-work judgment

Before writing code:

1. State assumptions — if uncertain, ask. Do not silently pick one.
2. Surface multiple interpretations — if the request points in several directions, present all of them.
3. Simpler alternatives — name them when they exist.
4. Stop and ask — if anything is unclear, stop and name what is unclear.

Test: *"If this interpretation is wrong, will the user have to ask for the work again?" → ✓ → confirm before starting.*

## CONTEXT.md capsule rules

Place a `CONTEXT.md` at the codebase root. Any directory containing a `CONTEXT.md` is a **Context Capsule**. When exploring a capsule, read the `CONTEXT.md` and its entry point first; descend into inner files only when needed — do not re-read the entire capsule on every task. Capsules can nest (child capsule inside a parent).

Fixed CONTEXT.md shape:

```markdown
---
name: <capsule name>
purpose: <one-line responsibility>
entry: <entry-point path>           # single file
entry: [<path>, <path>, ...]        # multiple files
when:
  - <invocation context>
---

## Domain Terms
- **<domain term>** — <definition>
```

- frontmatter has 4 fixed fields (`name`, `purpose`, `entry`, `when`).
- `when` — high-level scenarios in which the agent invokes this capsule. 1–3 bullets recommended. Needing more is a signal that the capsule's responsibility has grown too wide; consider splitting.
- Body `## Domain Terms` — **only when present**. A domain term is a name whose meaning is fixed inside the capsule. Exclude generic words and identifiers whose meaning is closed by language convention. A child capsule's domain terms live in the child CONTEXT.md only.

Splitting: when a split is reported, propose it to the user. Split a capsule only when the user approves or explicitly asks. **Do not mix changes and splits in one go.**

Synchronization: when a capsule's entry points or domain terms change, update CONTEXT.md alongside the code. Breaking changes go through CONTEXT.md and the code in the same PR.

## Entry rules

`entry` is the single source of truth for the capsule's outward contract. Pin the following so an agent can call and review by reading entry alone:

1. Exposed symbols: every externally exposed function, class, type, and constant flows through `entry`'s exports. Symbols not in `entry` do not exist outside the capsule.
2. Signatures: types in statically-typed languages; type hints / JSDoc in dynamic languages.
3. Side effects: DB / network / file / log / env / time and other effects not visible in the signature go in the docstring.
4. Error model: throwable exceptions and their meaning go in the docstring (or a type like `Result<T, E>`).

Non-obvious preconditions, postconditions, invariants, external dependencies, and concurrency models also belong in the docstring when they apply.

The entry point is a source file inside the capsule directory. When the outward contract fits in one file, write a single path (e.g. `entry: index.ts`). When it spans several files, list them as an array (e.g. `entry: [routes.ts, schema.ts]`). Do not maintain a separate markdown interface document.

## Domain term collision rules

Across all CONTEXT.md files in the repo (parent / child / sibling, all the same), the following are violations:

- Duplication: the same domain term defined with the same meaning in two or more CONTEXT.md files. Define it in the narrowest context that covers all referencing capsules (in the child if it stays inside the child; higher up if it leaks out). Remove from other locations.
- Collision: the same domain term used with different meanings in two CONTEXT.md files. Rename one or both, or unify the definition.

Inside one capsule, use one name per concept. When the external API and internal representation differ (e.g. snake_case vs camelCase), map explicitly at the entry boundary; past that, use a single name internally.

## WHY comment rules

Form: `// WHY: reason` (use the language's comment marker — `#`, `/* */`, etc.). For multi-line, tag only the first line; indent continuation lines.

```ts
// WHY: This updates shared state, so parallelizing it would cause a race condition.
//      Sequential execution must be preserved.
```

Attach `// WHY:` whenever any of the following applies:

1. **A simpler-looking approach was deliberately rejected.**
2. **A choice that runs counter to intuition.**
3. **A workaround for a past bug or issue.**
4. **A choice driven by performance, security, or compatibility constraints.**

Test: *"Without this comment, would an agent seeing this code for the first time think 'I could simplify this' and roll it back?"*

When editing or removing a `WHY:` line, first **verify the comment's condition still holds**. If it no longer holds, update both the comment and the code. Never change the code while leaving the comment.

## Change scope limits

Even on lines without a `WHY:` comment, do not touch what is outside the request:

- Do not "improve" adjacent code, comments, or formatting.
- Do not refactor what is not broken.
- Keep the existing style (do not rewrite to taste).
- Unrelated dead code: **mention it**, do not delete it.
- Orphans your change introduces (unused imports / variables / functions): remove them. Pre-existing dead code stays unless asked.

Test: *"Does every changed line trace directly to the user's request?"*

## Automatic capsule injection

The plugin's hooks intercept `Read` / `Edit` / `Write` / `MultiEdit` / `NotebookEdit` calls and automatically inject the ancestor CONTEXT.md chain of the targeted file as a system-reminder.

- Injection form: `<patchwork-context path="...">...</patchwork-context>` blocks listed root → leaf.
- The second time the same capsule is encountered in the same session, it is omitted from output as long as its content is unchanged (silent skip).
- Calls that edit a CONTEXT.md itself (`Edit`/`Write`/`MultiEdit`/`NotebookEdit` with target file `CONTEXT.md`) suppress chain injection — this prevents the capsule's own body from being re-injected into the prompt as a self-loop.
- The hook also runs after tool execution (PostToolUse) — if a CONTEXT.md was edited, its hash is refreshed against the new body; if an inner file was edited, the mtime of the nearest ancestor CONTEXT.md is tracked.

Because automatic injection is independent of explicit tool calls, the agent normally does not need to call the tools by hand. For cases that do require an explicit call, see the tool section below.

## Tool usage rules

Use the following tools instead of reading CONTEXT.md directly:

- **MCP `search`** — At a given location, find the CONTEXT.md there and in immediate children one level deep (deeper nesting is ignored). Returns a JSON array of `name`, `purpose`, `path`. Tool name: `mcp__patchwork__search`. Args: `{ path?: string }` (defaults to cwd).
- **MCP `read_context`** — Read the ancestor CONTEXT.md chain from a given path up to the filesystem root. Output is a string of `<patchwork-context path="...">...</patchwork-context>` blocks, top-down. CONTEXT.md already served in this session with the same hash appears with `(already read)` as the body (lifetime: MCP server process). Tool name: `mcp__patchwork__read_context`. Args: `{ path?: string }` (defaults to cwd).
- **Static script `doctor`** — Checks for broken frontmatter (4 fields: `name`/`purpose`/`entry`/`when`), empty `when` list, and body over 300 lines. On violation, prints a `<patchwork-instruction>` block with the prescription. Run: `node $CLAUDE_PLUGIN_ROOT/scripts/context-doctor.mjs [<root>]`. Defaults to cwd. exit 0.

## Domain Terms

- **Context Capsule** — A directory containing `CONTEXT.md`. The unit of exploration where the entry point and CONTEXT.md are read first.
- **Entry point** — A capsule's outward boundary file. Its path is recorded in the CONTEXT.md frontmatter `entry` field.
- **Intent comment / `WHY:` comment** — A comment recording "why this was done."
- **Rollback** — Reverting previously-changed code back to a problematic earlier state.

</patchwork>
