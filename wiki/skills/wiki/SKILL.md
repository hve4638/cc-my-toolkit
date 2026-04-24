---
name: wiki
description: LLM Wiki — persistent markdown knowledge base that compounds across sessions (Karpathy model)
triggers: ["wiki", "wiki this", "wiki add", "wiki lint", "wiki query"]
---

# Wiki

Persistent, self-maintained markdown knowledge base for project and session knowledge. Inspired by Karpathy's LLM Wiki concept.

## Operations

### Ingest
Process knowledge into wiki pages. A single ingest can touch multiple pages.

```
wiki_ingest({ title: "Auth Architecture", content: "...", tags: ["auth", "architecture"], category: "architecture" })
```

### Query
Search across all wiki pages by keywords and tags. Returns matching pages with snippets — YOU (the LLM) synthesize answers with citations from the results.

```
wiki_query({ query: "authentication", tags: ["auth"], category: "architecture" })
```

### Lint
Run health checks on the wiki. Detects orphan pages, stale content, broken cross-references, oversized pages, and structural contradictions.

```
wiki_lint()
```

### Quick Add
Add a single page quickly (simpler than ingest).

```
wiki_add({ title: "Page Title", content: "...", tags: ["tag1"], category: "decision" })
```

### List / Read / Delete
```
wiki_list()           # Show all pages (reads index.md)
wiki_read({ page: "auth-architecture" })  # Read specific page
wiki_delete({ page: "outdated-page" })    # Delete a page
```

### Log
View wiki operation history by reading `.wiki/log.md`.

## Categories
Pages are organized by category: `architecture`, `decision`, `pattern`, `debugging`, `environment`, `session-log`, `reference`, `convention`.

## Storage
- Pages: `.wiki/*.md` (markdown with YAML frontmatter)
- Index: `.wiki/index.md` (auto-maintained catalog)
- Log: `.wiki/log.md` (append-only operation chronicle)
- Config: `.wiki/.config.json` (flat JSON — see below)

## Cross-References
Use `[[page-name]]` wiki-link syntax to create cross-references between pages.

## Auto-Capture
At session end, session metadata is automatically captured as a `session-log-<date>-<id>.md` page (metadata only — no LLM calls). Configure via `.wiki/.config.json`:

```json
{
  "autoCapture": true,
  "staleDays": 30,
  "maxPageSize": 10240
}
```

| 키 | 기본 | 설명 |
|---|---|---|
| `autoCapture` | `true` | Stop 훅에서 세션 메타 자동 캡처 |
| `staleDays` | `30` | lint 에서 stale 판정 기준 일수 |
| `maxPageSize` | `10240` | 페이지당 바이트 상한 (lint 경고) |

## Hard Constraints
- NO vector embeddings — query uses keyword + tag matching only
- Wiki pages are project-local (`.wiki/`) — add to `.gitignore` if you want them local-only
