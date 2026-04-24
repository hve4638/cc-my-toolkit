/**
 * Worktree Path Enforcement
 *
 * Provides strict path validation and resolution for `.wiki/` paths,
 * ensuring all operations stay within the worktree boundary.
 *
 * Supports OMC_STATE_DIR environment variable for centralized state storage.
 * When set, state is stored at $OMC_STATE_DIR/{project-identifier}/ instead
 * of {worktree}/.wiki/, preserving state across worktree deletions.
 */

import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { existsSync, realpathSync } from 'fs';
import { resolve, relative, sep, join, isAbsolute, basename, dirname } from 'path';

export const OmcPaths = {
  ROOT: '.wiki',
} as const;

const MAX_WORKTREE_CACHE_SIZE = 8;
const worktreeCacheMap = new Map<string, string>();

/**
 * Get the git worktree root for the current or specified directory.
 * Returns null if not in a git repository.
 */
export function getWorktreeRoot(cwd?: string): string | null {
  const effectiveCwd = cwd || process.cwd();

  if (worktreeCacheMap.has(effectiveCwd)) {
    const root = worktreeCacheMap.get(effectiveCwd)!;
    worktreeCacheMap.delete(effectiveCwd);
    worktreeCacheMap.set(effectiveCwd, root);
    return root || null;
  }

  try {
    const root = execSync('git rev-parse --show-toplevel', {
      cwd: effectiveCwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();

    if (worktreeCacheMap.size >= MAX_WORKTREE_CACHE_SIZE) {
      const oldest = worktreeCacheMap.keys().next().value;
      if (oldest !== undefined) {
        worktreeCacheMap.delete(oldest);
      }
    }
    worktreeCacheMap.set(effectiveCwd, root);
    return root;
  } catch {
    return null;
  }
}

const dualDirWarnings = new Set<string>();

/**
 * Get a stable project identifier for centralized state storage.
 *
 * Uses git remote URL hash (stable across worktrees/clones) with fallback
 * to worktree root path hash for local-only repos.
 */
export function getProjectIdentifier(worktreeRoot?: string): string {
  const root = worktreeRoot || getWorktreeRoot() || process.cwd();

  let source: string;
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    source = remoteUrl || root;
  } catch {
    source = root;
  }

  // Resolve linked worktrees to the primary repo root so sibling worktrees
  // share the same project identifier.
  let primaryRoot = root;
  try {
    const commonDir = execSync('git rev-parse --path-format=absolute --git-common-dir', {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();
    const isGitDir = basename(commonDir) === '.git';
    const isSubmodule = commonDir.includes(`${sep}.git${sep}modules`);
    if (isGitDir && !isSubmodule) {
      const resolved = dirname(commonDir);
      if (resolved && resolved !== root) {
        primaryRoot = resolved;
      }
    }
  } catch {
    // fall back to worktree root
  }

  const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
  const dirName = basename(primaryRoot).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${dirName}-${hash}`;
}

/**
 * Get the wiki root directory path.
 *
 * When OMC_STATE_DIR is set, returns $OMC_STATE_DIR/{project-identifier}/
 * instead of {worktree}/.wiki/.
 */
export function getOmcRoot(worktreeRoot?: string): string {
  const customDir = process.env.OMC_STATE_DIR;
  if (customDir) {
    const root = worktreeRoot || getWorktreeRoot() || process.cwd();
    const projectId = getProjectIdentifier(root);
    const centralizedPath = join(customDir, projectId);

    const legacyPath = join(root, OmcPaths.ROOT);
    const warningKey = `${legacyPath}:${centralizedPath}`;
    if (!dualDirWarnings.has(warningKey) && existsSync(legacyPath) && existsSync(centralizedPath)) {
      dualDirWarnings.add(warningKey);
      console.warn(
        `[wiki] Both legacy state dir (${legacyPath}) and centralized state dir (${centralizedPath}) exist. ` +
        `Using centralized dir. Consider migrating data from the legacy dir and removing it.`
      );
    }

    return centralizedPath;
  }
  const root = worktreeRoot || getWorktreeRoot() || process.cwd();
  return join(root, OmcPaths.ROOT);
}

/**
 * Validate that a workingDirectory is within the trusted worktree root.
 * The trusted root is derived from process.cwd(), NOT from user input.
 *
 * Always returns a git worktree root — never a subdirectory.
 *
 * @throws Error if workingDirectory is outside trusted root
 */
export function validateWorkingDirectory(workingDirectory?: string): string {
  const trustedRoot = getWorktreeRoot(process.cwd()) || process.cwd();

  if (!workingDirectory) {
    return trustedRoot;
  }

  const resolved = resolve(workingDirectory);

  let trustedRootReal: string;
  try {
    trustedRootReal = realpathSync(trustedRoot);
  } catch {
    trustedRootReal = trustedRoot;
  }

  const providedRoot = getWorktreeRoot(resolved);

  if (providedRoot) {
    let providedRootReal: string;
    try {
      providedRootReal = realpathSync(providedRoot);
    } catch {
      throw new Error(`workingDirectory '${workingDirectory}' does not exist or is not accessible.`);
    }

    if (providedRootReal !== trustedRootReal) {
      console.error('[worktree] workingDirectory resolved to different git worktree root, using trusted root', {
        workingDirectory: resolved,
        providedRoot: providedRootReal,
        trustedRoot: trustedRootReal,
      });
      return trustedRoot;
    }

    return providedRoot;
  }

  let resolvedReal: string;
  try {
    resolvedReal = realpathSync(resolved);
  } catch {
    throw new Error(`workingDirectory '${workingDirectory}' does not exist or is not accessible.`);
  }

  const rel = relative(trustedRootReal, resolvedReal);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`workingDirectory '${workingDirectory}' is outside the trusted worktree root '${trustedRoot}'.`);
  }

  return trustedRoot;
}
