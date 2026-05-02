---
name: init-context
disable-model-invocation: true
description: "Use this skill via `/init-context` to (re)generate a CLAUDE.md by composing the master skeleton, every active hve plugin's `docs/AGENTS.partial.md`, and selected rule/lang fragments. Run it when bootstrapping or refreshing project/global agent context to avoid hand-maintained drift, missed plugin guidance, and stale agent-routing tables. Idempotent via SHA-256 input hashing; writes `~/.claude/CLAUDE.md` (Global) or `<cwd>/CLAUDE.md` (Project)."
---

<init_context_instruction>
# init-context

Generate `~/.claude/CLAUDE.md` (Global mode) or `<cwd>/CLAUDE.md` (Project mode) by composing the master skeleton, each active plugin's `docs/AGENTS.partial.md`, and the user's selected rule-* / lang-* fragments. Do the synthesis directly without delegating to a sub-agent.

---

## 1. Mode selection

If `process.cwd() === os.homedir()` matches exactly, enter **Global mode automatically**. Otherwise let the user pick via AskUserQuestion.

Options:
- `Global`: inject the active hve plugin guides into `~/.claude/CLAUDE.md`
- `Project`: synthesize project context into `<cwd>/CLAUDE.md`

---

## 2. Plugin discovery + interview

### Discovery (script)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/init-context/scripts/detect-active-plugins.mjs" --mode=<global|project>
```

Script emits JSON: `[{name, owner, installPath, hasPartial}, ...]`

Internal matching:
- `Global`: merge `enabledPlugins` from `~/.claude/settings.json` + `~/.claude/settings.local.json` → match in `~/.claude/plugins/installed_plugins.json` where `scope === "user"`
- `Project`: merge `enabledPlugins` from `<cwd>/.claude/settings.json` + `<cwd>/.claude/settings.local.json` (empty if absent) → match in `installed_plugins.json` where `(scope === "project" || scope === "local")` AND `projectPath === <cwd>`

Only entries with `hasPartial === true` are eligible synthesis candidates.

### Interview

Present candidates via AskUserQuestion (multiSelect). The user picks which to include in synthesis.

If the candidate list is empty, skip this stage (proceed without plugin content).

---

## 3. Rule interview

Scan `${CLAUDE_PLUGIN_ROOT}/skills/init-context/fragments/rule-*.md` directly. Use each fragment's `description` as the option label and present via AskUserQuestion (multiSelect). **Ignore `condition`** — let the user choose freely.

---

## 4. Lang interview

### Global mode

AskUserQuestion (single-select):
- `Skip`: print one-line note ("Recommend keeping lang rules per-project")
- `Add to global CLAUDE.md`: multiSelect over all `lang-*` fragments

### Project mode

#### 4-1. Codebase language detection (script)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/init-context/scripts/detect-languages.mjs"
```

JSON output: `[{lang, evidence, fragmentName}, ...]` (e.g., `[{lang:"python", evidence:"pyproject.toml + 23 *.py", fragmentName:"lang-python"}]`)

#### 4-2. Report + selection

Report detected languages in 1–2 lines. Then AskUserQuestion (single-select):
- `Add detected language rules`: include every detected `lang-*` automatically
- `Skip`
- `Choose manually`: multiSelect over all `lang-*` fragments

---

## 5. Conflict check (policy-only)

Inspect each selected fragment's frontmatter `conflicts_with` and check pairwise:
- No match → proceed.
- Match found → ask the user once via AskUserQuestion and let them resolve (no automatic resolution).

Tone or duplicate-content conflicts are not checked — policy conflicts only.

---

## 6. Synthesis

### 6-1. Load the master skeleton

Read `${CLAUDE_PLUGIN_ROOT}/skills/init-context/AGENTS.skeleton.md` to determine tag order.

### 6-2. Collect plugin content

For each selected plugin, read `<installPath>/docs/AGENTS.partial.md` and split it by XML tag.

### 6-3. Same-tag merging

Following the master tag order:
- Gather contributions from multiple plugins for the same tag into one section.
- Order within a tag is your discretion. Decide by logical grouping and importance.
- Tags with no contributor remain as placeholder comments to preserve their slot.
  ```
  <!-- <skills></skills> -->
  ```

### 6-4. Rule / lang sections

```
# Rules

## <fragment name>
(fragment body, frontmatter stripped)

# Languages

## <fragment name>
(fragment body, frontmatter stripped)
```

### 6-5. Compute input hash

Serialize the following as canonical JSON, then SHA-256:
```json
{
  "plugins": [{name, installPath, partialBody}, ...],
  "selections": {
    "plugins": [...selected names],
    "rules": [...selected fragment names],
    "langs": [...selected fragment names]
  }
}
```

Compute via Bash:
```bash
echo -n '<serialized JSON>' | sha256sum
```

Or write to a temp file and run `sha256sum <file>`.

---

## 7. Idempotency check

Extract the existing output's `<!-- HVE:HASH:sha256-... -->` — **use `cat`** (the Read tool strips HTML comments).

```bash
cat ~/.claude/CLAUDE.md  # or ./CLAUDE.md
```

Compare:
- Hashes match → report "no changes" and exit. Skip writing.
- Hashes differ (or no marker exists) → proceed to output.

---

## 8. Output

### 8-1. Backup

If the output file exists, move it to a `.bak` sibling:
- `~/.claude/CLAUDE.md` → `~/.claude/CLAUDE.md.bak`
- `<cwd>/CLAUDE.md` → `<cwd>/CLAUDE.md.bak`

If the `.bak` already exists, ask via AskUserQuestion how to handle it (overwrite / different name / abort).

### 8-2. Global mode — marker block

```
<!-- HVE:START -->
<!-- HVE:VERSION:1 -->
<!-- HVE:GENERATED-AT:<ISO-8601 UTC> -->
<!-- HVE:PLUGINS: <name1>, <name2>, ... -->
<!-- HVE:HASH:sha256-<hex> -->

# hve marketplace

(XML tag synthesis body — master order)

# Rules

(rule body)

# Languages

(lang body, if selected)

<!-- HVE:END -->
```

Block placement:
- No existing marker (or no file) → **prepend at the top of the file** (or create a new file containing only the marker block)
- Existing marker → keep marker position, replace only the content inside. Preserve user content above and below the marker.

### 8-3. Project mode — whole file

```
# CLAUDE.md

<!-- HVE:VERSION:1 -->
<!-- HVE:GENERATED-AT:<ISO-8601 UTC> -->
<!-- HVE:PLUGINS: ... -->
<!-- HVE:HASH:sha256-... -->

(XML tag synthesis body)

# Rules
...

# Languages
...
```

Replace the entire file.

---

## 9. Report

One- or two-line summary:
- Mode (Global / Project)
- Number of plugins, rules, langs included
- Backup path (if any)
- Whether the body changed (wrote vs skipped)

---

## Reading the original — `cat` required

When inspecting the marker or meta comments of an existing output, the **Read tool strips HTML comments**. **Use Bash `cat`.**

```bash
cat ~/.claude/CLAUDE.md
cat ./CLAUDE.md
```

Node scripts use `fs.readFile` directly and are not affected.

---

## Empty-result handling

If plugins, rules, and langs are all 0, the synthesis body is nothing but placeholder comments. In that case:
- One-line report: "No content selected; nothing to write."
- Skip writing.

---

## Caveats

Content inside the marker block is overwritten on the next run. Tell the user to keep manual notes outside the marker.

When `cwd === os.homedir()` the skill always enters Global mode. Project mode cannot be selected from the home directory.

XML tags follow a simple convention only. Nesting, attributes, and CDATA are not parsed.

Within-tag ordering is your discretion, so output may differ slightly between runs. The idempotency check is input-hash based, so write-skip behavior is unaffected.

</init_context_instruction>

$ARGUMENTS
