---
name: skillify
disable-model-invocation: true
argument-hint: "[optional: short description or slug of the skill to create]"
---

<skillify_instruction>
# skillify

skillify is the skill-authoring rule set for this project. Both new skill creation and existing skill review use this rule set as the reference.

For the authoring procedure (interview, slug decision, review, translation, report), see [SKILLIFY-WORKFLOW.md](./SKILLIFY-WORKFLOW.md).

---

## Frontmatter

| Scenario | `disable-model-invocation` |
|---|---|
| Guardrail (auto-trigger via description matching) | (omit) |
| Manual invocation only (called via `/<slug>` only) | `true` |

If the skill takes an argument, add `argument-hint: "[description]"`.

---

## Description

The description satisfies all 7 principles below.

1. `Imperative, addressed to a future Agent` — `"Use this skill when ..."`, `"Make sure to consult ..."`. The declarative form (`"This skill does X"`) is forbidden.
2. `Intent` — written as the *task the Agent is about to perform*. Description of the skill's *contents* (`"contains rules about X"`) is forbidden.
3. `Precision` — both under-trigger and over-trigger fail. Trigger categories must be exact.
4. `WHY explicit` — what failure does this prevent. Pattern: `"Consult it to avoid {specific failure mode}"`.
5. `Distinctive` — at least one of: tool name, command, or error message.
6. `Length` — 100–200 words recommended; max 1024 chars; no `<` or `>`.
7. `Generalize, don't overfit` — no specific queries enumerated; trigger categories only.

### Strong prohibitions

- Do not stack uppercase `MUST` / `ALWAYS` / `NEVER`.
- Do not include safety-net clauses (`"even when user doesn't ask ..."`).
- Do not embed behavioral rules in the description.

### description vs body division

- description = trigger matching entry point + WHY
- body = behavior after invocation

Do not include rules in the description.

### Example

❌ Description with rules embedded (body becomes meaningless):

```
"Use this skill when writing git rebase commands. The --no-edit flag is invalid for git rebase — omit it. Consult it to avoid an unknown switch error."
```

⭕ Trigger + WHY only (body carries the rule):

```
"Use this skill when writing or proposing `git rebase` commands. Consult it to avoid passing an invalid flag combination that aborts the rebase with an 'unknown switch' error."
```

---

## Body

### Instructions only

The body holds only *instructions* and *the targets of those instructions* (outputs, inputs, objects acted on). Do not include the following in the body:

- Meta about the skill itself (audience, prerequisites, importance)
- Rationale appended after a `—` on a bullet
- Adjacent-tool comparison tables
- Noun-phrase items without an imperative verb

Basic skeleton (guardrail type):

```yaml
---
name: <slug>
description: "..."
---

## Rule
<what to do / what not to do>

## Not a violation
<1–2 normal cases where this rule does not apply. Omit the section entirely if empty>
```

Other types:

- Workflow type (multi-step procedure): `### Step 1...N`
- Meta type (skill of skills, e.g. skillify, reflect): combination of workflow + principles + boundaries
- Reference type (knowledge storage): `## Category` / `## Items` — facts over rules

Add if needed:
- `## Reason` — tradeoffs or environmental premise
- `## Boundary` — distinction from adjacent skills (to avoid confusion)

### Separate deterministic from judgment

The body holds only *judgment-required parts*. *Deterministic* steps (computation, fixed transformation, set procedure) are separated:

- Code skills → extract into `scripts/<name>.{sh,mjs,py}` and have the body invoke them
- Manual / document skills → extract into a fixed template like `assets/<name>.md` and have the body reference it

### Body discipline

- Do not use `**bold**` on the leading word of a bullet.
- Use bold sparingly, only on critical rules that change behavior.
- When a behavioral prescription ("do not do X") can be reframed as a structural guardrail ("if X is done, declare it"), prefer the guardrail form.

</skillify_instruction>

$ARGUMENTS
