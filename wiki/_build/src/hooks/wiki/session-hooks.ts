/**
 * Wiki Session Hooks
 *
 * SessionStart: load wiki context, inject relevant pages, lazy index rebuild
 * SessionEnd: bounded append-only capture of session metadata
 * PreCompact: inject wiki summary for compaction survival
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getOmcRoot } from '../../lib/worktree-paths.js';
import {
  getWikiDir,
  readIndex,
  readAllPages,
  listPages,
  withWikiLock,
  writePageUnsafe,
  updateIndexUnsafe,
  appendLogUnsafe,
} from './storage.js';
import { WIKI_SCHEMA_VERSION, DEFAULT_WIKI_CONFIG } from './types.js';
import type { WikiConfig } from './types.js';

/**
 * Load wiki config from .wiki/.config.json (flat structure).
 * Returns defaults if config doesn't exist.
 */
function loadWikiConfig(root: string): WikiConfig {
  try {
    const configPath = join(getOmcRoot(root), '.config.json');
    if (existsSync(configPath)) {
      const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (raw && typeof raw === 'object') {
        return { ...DEFAULT_WIKI_CONFIG, ...raw };
      }
    }
  } catch {
    // Ignore config errors, use defaults
  }
  return DEFAULT_WIKI_CONFIG;
}

/**
 * SessionStart hook: inject wiki context into session.
 *
 * 1. Read wiki index, rebuild if stale
 * 2. Feed project-memory into environment.md if newer
 * 3. Return context summary for injection
 */
export function onSessionStart(data: { cwd?: string }): { additionalContext?: string } {
  try {
    const root = data.cwd || process.cwd();
    const wikiDir = getWikiDir(root);

    if (!existsSync(wikiDir)) {
      return {}; // No wiki yet, nothing to inject
    }

    // Lazy index rebuild
    const pages = listPages(root);
    if (pages.length > 0) {
      const indexContent = readIndex(root);
      if (!indexContent) {
        // Index missing — rebuild
        withWikiLock(root, () => { updateIndexUnsafe(root); });
      }
    }

    // Build context summary
    const index = readIndex(root);
    if (!index || pages.length === 0) return {};

    const summary = [
      `[LLM Wiki: ${pages.length} pages at .wiki/]`,
      '',
      'Use wiki_query to search, wiki_list to browse, wiki_read to view pages.',
      '',
      index.split('\n').slice(0, 30).join('\n'), // First 30 lines of index
    ].join('\n');

    return { additionalContext: summary };
  } catch {
    return {};
  }
}

/**
 * SessionEnd hook: bounded append-only capture of session metadata.
 *
 * Captures raw session data as a session-log page.
 * Does NOT do LLM-judged curation — that happens via skill on next session.
 * Hard timeout: 3s via Promise.race pattern (sync version uses try/catch + time check).
 */
export function onSessionEnd(data: { cwd?: string; session_id?: string }): { continue: boolean } {
  const startTime = Date.now();
  const TIMEOUT_MS = 3_000;

  try {
    const root = data.cwd || process.cwd();
    const config = loadWikiConfig(root);

    if (!config.autoCapture) {
      return { continue: true };
    }

    const wikiDir = getWikiDir(root);
    if (!existsSync(wikiDir)) {
      // Don't create wiki dir just for session logging
      return { continue: true };
    }

    const sessionId = data.session_id || `session-${Date.now()}`;
    const now = new Date().toISOString();
    const dateSlug = now.split('T')[0]; // YYYY-MM-DD
    const filename = `session-log-${dateSlug}-${sessionId.slice(-8)}.md`;

    withWikiLock(root, () => {
      // Time check inside lock
      if (Date.now() - startTime > TIMEOUT_MS) return;

      writePageUnsafe(root, {
        filename,
        frontmatter: {
          title: `Session Log ${dateSlug}`,
          tags: ['session-log', 'auto-captured'],
          created: now,
          updated: now,
          sources: [sessionId],
          links: [],
          category: 'session-log',
          confidence: 'medium',
          schemaVersion: WIKI_SCHEMA_VERSION,
        },
        content: `\n# Session Log ${dateSlug}\n\nAuto-captured session metadata.\nSession ID: ${sessionId}\n\nReview and promote significant findings to curated wiki pages via \`wiki_ingest\`.\n`,
      });

      appendLogUnsafe(root, {
        timestamp: now,
        operation: 'ingest',
        pagesAffected: [filename],
        summary: `Auto-captured session log for ${sessionId}`,
      });

      // Do NOT rebuild index here — keep SessionEnd fast
    });
  } catch {
    // Silently fail — session end should never block
  }

  return { continue: true };
}

/**
 * PreCompact hook: inject wiki summary for compaction survival.
 */
export function onPreCompact(data: { cwd?: string }): { additionalContext?: string } {
  try {
    const root = data.cwd || process.cwd();
    const pages = listPages(root);

    if (pages.length === 0) return {};

    const allPages = readAllPages(root);
    const categories = [...new Set(allPages.map(p => p.frontmatter.category))];
    const latestUpdate = allPages
      .map(p => p.frontmatter.updated)
      .sort()
      .reverse()[0] || 'unknown';

    return {
      additionalContext: `[Wiki: ${pages.length} pages | categories: ${categories.join(', ')} | last updated: ${latestUpdate}]`,
    };
  } catch {
    return {};
  }
}
