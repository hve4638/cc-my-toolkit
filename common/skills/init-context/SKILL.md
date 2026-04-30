---
name: init-context
description: "Generate a project-specific CLAUDE.md. Scans every fragment under `${CLAUDE_PLUGIN_ROOT}/skills/init-context/fragments/` directly, reads the frontmatter (name, description, condition), and matches conditions against codebase/environment signals to shortlist candidates. Synthesizes and finalizes after user confirmation. Trigger examples: '/init-context', 'create CLAUDE.md', 'initialize project context'. Explicit invocation only — no auto-trigger. See `${CLAUDE_PLUGIN_ROOT}/skills/init-context/README.md` for design intent and the fragment authoring spec."
---

<init_context_instruction>
# init-context

Build CLAUDE.md in 6 stages: Scan → Match → Confirm → Synthesize → Conflict check → Finalize.

---

## Inputs and outputs

- Fragment source: `${CLAUDE_PLUGIN_ROOT}/skills/init-context/fragments/*.md` only. Do not author new fragments outside this folder. The SKILL reads this folder fresh on every invocation — do not hardcode fragment names into the SKILL body.
- Intermediate output: `CLAUDE.draft.md` at each output path.
- Final output: `CLAUDE.md` at the project root. When multi-language distribution applies, additional `CLAUDE.md` files may be produced under subdirectories (see `lang-*` special rule).
- Backup policy: applied identically at each output path. If a `CLAUDE.md` already exists, move it to `CLAUDE.md.bak` at the same path immediately before stage 6 (no overwrite). If `CLAUDE.md.bak` already exists, ask the user how to proceed.

---

## Prefix categories

- `lang-*` — language/runtime conventions.
- `rule-*` — coding discipline, guides, methodologies.

The SKILL uses these two prefixes to drive synthesis group order and the `lang-*` special rule.

---

## 1. Scan

Read every file under `${CLAUDE_PLUGIN_ROOT}/skills/init-context/fragments/*.md` and collect each fragment's `condition`. Derive the signal categories those conditions commonly require, then collect them in one pass. Read-only tools only.

Signal categories (illustrative — collect only what the fragment conditions actually demand):

- Codebase — file extension distribution, manifests, lockfiles, directory structure.
- Active environment — currently available SKILLs, active plugins.

Summarize the collected signals in 5 lines or fewer for the user.

---

## 2. Match

Classify each fragment into one of three buckets.

- Match — `condition` is satisfied by the signals → automatic candidate.
- No match — `condition` clearly contradicts the signals → automatically excluded (do not ask the user).
- Needs confirmation — one of:
  - The fragment has no `condition` key (always decided by user intent).
  - The `condition` match is ambiguous.

### `lang-*` special rule

- `lang-*` fragments are candidates only for coding-centric projects (otherwise auto-excluded).
- If two or more `lang-*` fragments match, inspect the codebase's language distribution.
  - Roughly balanced ratio with both languages spread across the codebase → synthesize all into the root CLAUDE.md.
  - One language dominates and the non-dominant language is concentrated in a specific subdirectory → put the dominant language in the root CLAUDE.md and the non-dominant language in that subdirectory's CLAUDE.md.
  - If neither case clearly applies, ask the user once how to distribute.

This branching can yield N outputs (1 root + 0..M subdirectories). Stages 4–6 repeat identically for each output.

---

## 3. Confirm

Show the user the matched + ambiguous fragments together in a single table and ask whether to apply each one. Columns: fragment `name`, `description`, match status, match reasoning.

Auto-excluded fragments are not listed in the table — only note "(N excluded automatically)" in the summary line.

When the user toggles, adds, or removes entries, the result is the final selection set.

---

## 4. Synthesize

Concatenate the selected fragments in the prescribed order to produce `CLAUDE.draft.md`.

- **Do not modify fragment bodies.** Strip only the frontmatter (`---` block) and copy the body verbatim. This is what makes CLAUDE.md re-synthesis idempotent when fragments are updated.
- Group order: `lang-*` → `rule-*`. Within a group, sort alphabetically by filename.
- When concatenating, insert exactly one `\n` between fragments. Whitespace normalization happens in stage 6.
- Heading collisions are handled in stage 5. Leave them as-is here.
- Top header: place `# CLAUDE.md` on the first line of the file.

---

## 5. Conflict check

Re-read `CLAUDE.draft.md` and look for contradictions.

- Directive conflict — one fragment mandates a tool while another uses an example referencing a different tool, etc.
- Tone conflict — one fragment is a strict guardrail while another is advisory on the same axis.
- Duplicate content — two fragments cover the same topic with different wording.

Ask the user once for a decision on any conflict found (no automatic decisions). If there are no conflicts, proceed to stage 6.

---

## 6. Finalize

1. If `CLAUDE.md` already exists, move it to `CLAUDE.md.bak` (if `CLAUDE.md.bak` already exists, ask the user how to handle it).
2. Normalize whitespace in `CLAUDE.draft.md`: collapse consecutive blank lines to one, ensure the file ends with exactly one newline.
3. Rename `CLAUDE.draft.md` to `CLAUDE.md`.
4. Report the result to the user in one line: which fragments were included, and the backup file path.

---

## Empty result handling

If the match stage yields zero matched + ambiguous fragments, do not synthesize — report to the user in one line. Do not produce an empty CLAUDE.md.

</init_context_instruction>

$ARGUMENTS
