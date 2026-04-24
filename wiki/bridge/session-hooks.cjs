"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/hooks/wiki/session-hooks.ts
var session_hooks_exports = {};
__export(session_hooks_exports, {
  onPreCompact: () => onPreCompact,
  onSessionEnd: () => onSessionEnd,
  onSessionStart: () => onSessionStart
});
module.exports = __toCommonJS(session_hooks_exports);
var import_fs4 = require("fs");
var import_path3 = require("path");

// src/lib/worktree-paths.ts
var import_crypto = require("crypto");
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_path = require("path");
var OmcPaths = {
  ROOT: ".wiki"
};
var MAX_WORKTREE_CACHE_SIZE = 8;
var worktreeCacheMap = /* @__PURE__ */ new Map();
function getWorktreeRoot(cwd) {
  const effectiveCwd = cwd || process.cwd();
  if (worktreeCacheMap.has(effectiveCwd)) {
    const root = worktreeCacheMap.get(effectiveCwd);
    worktreeCacheMap.delete(effectiveCwd);
    worktreeCacheMap.set(effectiveCwd, root);
    return root || null;
  }
  try {
    const root = (0, import_child_process.execSync)("git rev-parse --show-toplevel", {
      cwd: effectiveCwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5e3
    }).trim();
    if (worktreeCacheMap.size >= MAX_WORKTREE_CACHE_SIZE) {
      const oldest = worktreeCacheMap.keys().next().value;
      if (oldest !== void 0) {
        worktreeCacheMap.delete(oldest);
      }
    }
    worktreeCacheMap.set(effectiveCwd, root);
    return root;
  } catch {
    return null;
  }
}
var dualDirWarnings = /* @__PURE__ */ new Set();
function getProjectIdentifier(worktreeRoot) {
  const root = worktreeRoot || getWorktreeRoot() || process.cwd();
  let source;
  try {
    const remoteUrl = (0, import_child_process.execSync)("git remote get-url origin", {
      cwd: root,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    source = remoteUrl || root;
  } catch {
    source = root;
  }
  let primaryRoot = root;
  try {
    const commonDir = (0, import_child_process.execSync)("git rev-parse --path-format=absolute --git-common-dir", {
      cwd: root,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5e3
    }).trim();
    const isGitDir = (0, import_path.basename)(commonDir) === ".git";
    const isSubmodule = commonDir.includes(`${import_path.sep}.git${import_path.sep}modules`);
    if (isGitDir && !isSubmodule) {
      const resolved = (0, import_path.dirname)(commonDir);
      if (resolved && resolved !== root) {
        primaryRoot = resolved;
      }
    }
  } catch {
  }
  const hash = (0, import_crypto.createHash)("sha256").update(source).digest("hex").slice(0, 16);
  const dirName = (0, import_path.basename)(primaryRoot).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${dirName}-${hash}`;
}
function getOmcRoot(worktreeRoot) {
  const customDir = process.env.OMC_STATE_DIR;
  if (customDir) {
    const root2 = worktreeRoot || getWorktreeRoot() || process.cwd();
    const projectId = getProjectIdentifier(root2);
    const centralizedPath = (0, import_path.join)(customDir, projectId);
    const legacyPath = (0, import_path.join)(root2, OmcPaths.ROOT);
    const warningKey = `${legacyPath}:${centralizedPath}`;
    if (!dualDirWarnings.has(warningKey) && (0, import_fs.existsSync)(legacyPath) && (0, import_fs.existsSync)(centralizedPath)) {
      dualDirWarnings.add(warningKey);
      console.warn(
        `[wiki] Both legacy state dir (${legacyPath}) and centralized state dir (${centralizedPath}) exist. Using centralized dir. Consider migrating data from the legacy dir and removing it.`
      );
    }
    return centralizedPath;
  }
  const root = worktreeRoot || getWorktreeRoot() || process.cwd();
  return (0, import_path.join)(root, OmcPaths.ROOT);
}

// src/hooks/wiki/storage.ts
var import_fs3 = require("fs");
var import_path2 = require("path");

// src/lib/atomic-write.ts
var fsSync = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var crypto = __toESM(require("crypto"), 1);
function ensureDirSync(dir) {
  if (fsSync.existsSync(dir)) {
    return;
  }
  try {
    fsSync.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (err.code === "EEXIST") {
      return;
    }
    throw err;
  }
}
function atomicWriteFileSync(filePath, content) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tempPath = path.join(dir, `.${base}.tmp.${crypto.randomUUID()}`);
  let fd = null;
  let success = false;
  try {
    ensureDirSync(dir);
    fd = fsSync.openSync(tempPath, "wx", 384);
    fsSync.writeSync(fd, content, 0, "utf-8");
    fsSync.fsyncSync(fd);
    fsSync.closeSync(fd);
    fd = null;
    fsSync.renameSync(tempPath, filePath);
    success = true;
    try {
      const dirFd = fsSync.openSync(dir, "r");
      try {
        fsSync.fsyncSync(dirFd);
      } finally {
        fsSync.closeSync(dirFd);
      }
    } catch {
    }
  } finally {
    if (fd !== null) {
      try {
        fsSync.closeSync(fd);
      } catch {
      }
    }
    if (!success) {
      try {
        fsSync.unlinkSync(tempPath);
      } catch {
      }
    }
  }
}

// src/lib/file-lock.ts
var import_fs2 = require("fs");
var path2 = __toESM(require("path"), 1);

// src/platform/process-utils.ts
function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "EPERM") {
      return true;
    }
    return false;
  }
}

// src/lib/file-lock.ts
var DEFAULT_STALE_LOCK_MS = 3e4;
var DEFAULT_RETRY_DELAY_MS = 50;
function isLockStale(lockPath, staleLockMs) {
  try {
    const stat = (0, import_fs2.statSync)(lockPath);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < staleLockMs) return false;
    try {
      const raw = (0, import_fs2.readFileSync)(lockPath, "utf-8");
      const payload = JSON.parse(raw);
      if (payload.pid && isProcessAlive(payload.pid)) return false;
    } catch {
    }
    return true;
  } catch {
    return false;
  }
}
function lockPathFor(filePath) {
  return filePath + ".lock";
}
function tryAcquireSync(lockPath, staleLockMs) {
  ensureDirSync(path2.dirname(lockPath));
  try {
    const fd = (0, import_fs2.openSync)(
      lockPath,
      import_fs2.constants.O_CREAT | import_fs2.constants.O_EXCL | import_fs2.constants.O_WRONLY,
      384
    );
    try {
      const payload = JSON.stringify({ pid: process.pid, timestamp: Date.now() });
      (0, import_fs2.writeSync)(fd, payload, null, "utf-8");
    } catch (writeErr) {
      try {
        (0, import_fs2.closeSync)(fd);
      } catch {
      }
      try {
        (0, import_fs2.unlinkSync)(lockPath);
      } catch {
      }
      throw writeErr;
    }
    return { fd, path: lockPath };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "EEXIST") {
      if (isLockStale(lockPath, staleLockMs)) {
        try {
          (0, import_fs2.unlinkSync)(lockPath);
        } catch {
        }
        try {
          const fd = (0, import_fs2.openSync)(
            lockPath,
            import_fs2.constants.O_CREAT | import_fs2.constants.O_EXCL | import_fs2.constants.O_WRONLY,
            384
          );
          try {
            const payload = JSON.stringify({ pid: process.pid, timestamp: Date.now() });
            (0, import_fs2.writeSync)(fd, payload, null, "utf-8");
          } catch (writeErr) {
            try {
              (0, import_fs2.closeSync)(fd);
            } catch {
            }
            try {
              (0, import_fs2.unlinkSync)(lockPath);
            } catch {
            }
            throw writeErr;
          }
          return { fd, path: lockPath };
        } catch {
          return null;
        }
      }
      return null;
    }
    throw err;
  }
}
function acquireFileLockSync(lockPath, opts) {
  const staleLockMs = opts?.staleLockMs ?? DEFAULT_STALE_LOCK_MS;
  const timeoutMs = opts?.timeoutMs ?? 0;
  const retryDelayMs = opts?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const handle = tryAcquireSync(lockPath, staleLockMs);
  if (handle || timeoutMs <= 0) return handle;
  const deadline = Date.now() + timeoutMs;
  const sharedBuf = new SharedArrayBuffer(4);
  const sharedArr = new Int32Array(sharedBuf);
  while (Date.now() < deadline) {
    const waitMs = Math.min(retryDelayMs, deadline - Date.now());
    try {
      Atomics.wait(sharedArr, 0, 0, waitMs);
    } catch {
      const waitUntil = Date.now() + waitMs;
      while (Date.now() < waitUntil) {
      }
    }
    const retryHandle = tryAcquireSync(lockPath, staleLockMs);
    if (retryHandle) return retryHandle;
  }
  return null;
}
function releaseFileLockSync(handle) {
  try {
    (0, import_fs2.closeSync)(handle.fd);
  } catch {
  }
  try {
    (0, import_fs2.unlinkSync)(handle.path);
  } catch {
  }
}
function withFileLockSync(lockPath, fn, opts) {
  const handle = acquireFileLockSync(lockPath, opts);
  if (!handle) {
    throw new Error(`Failed to acquire file lock: ${lockPath}`);
  }
  try {
    return fn();
  } finally {
    releaseFileLockSync(handle);
  }
}

// src/hooks/wiki/types.ts
var WIKI_SCHEMA_VERSION = 1;
var DEFAULT_WIKI_CONFIG = {
  autoCapture: true,
  staleDays: 30,
  maxPageSize: 10240
  // 10KB
};

// src/hooks/wiki/storage.ts
var WIKI_DIR = "";
var INDEX_FILE = "index.md";
var LOG_FILE = "log.md";
var ENVIRONMENT_FILE = "environment.md";
var RESERVED_FILES = /* @__PURE__ */ new Set([INDEX_FILE, LOG_FILE, ENVIRONMENT_FILE]);
function getWikiDir(root) {
  return WIKI_DIR ? (0, import_path2.join)(getOmcRoot(root), WIKI_DIR) : getOmcRoot(root);
}
function ensureWikiDir(root) {
  const wikiDir = getWikiDir(root);
  if (!(0, import_fs3.existsSync)(wikiDir)) {
    (0, import_fs3.mkdirSync)(wikiDir, { recursive: true });
  }
  return wikiDir;
}
function withWikiLock(root, fn) {
  const wikiDir = ensureWikiDir(root);
  const lockPath = lockPathFor((0, import_path2.join)(wikiDir, ".wiki-lock"));
  return withFileLockSync(lockPath, fn, { timeoutMs: 5e3, retryDelayMs: 50 });
}
function parseFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  const yamlBlock = match[1];
  const content = match[2];
  try {
    const fm = parseSimpleYaml(yamlBlock);
    const frontmatter = {
      title: String(fm.title || ""),
      tags: parseYamlArray(fm.tags),
      created: String(fm.created || (/* @__PURE__ */ new Date()).toISOString()),
      updated: String(fm.updated || (/* @__PURE__ */ new Date()).toISOString()),
      sources: parseYamlArray(fm.sources),
      links: parseYamlArray(fm.links),
      category: fm.category || "reference",
      confidence: fm.confidence || "medium",
      schemaVersion: Number(fm.schemaVersion) || WIKI_SCHEMA_VERSION
    };
    return { frontmatter, content };
  } catch {
    return null;
  }
}
function parseSimpleYaml(yaml) {
  const result = {};
  for (const line of yaml.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1).replace(/\\(\\|"|n|r)/g, (_, ch) => {
        if (ch === "n") return "\n";
        if (ch === "r") return "\r";
        return ch;
      });
    }
    if (key) result[key] = value;
  }
  return result;
}
function parseYamlArray(value) {
  if (!value) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "").replace(/\\(\\|"|n|r)/g, (_, ch) => {
      if (ch === "n") return "\n";
      if (ch === "r") return "\r";
      return ch;
    })).filter(Boolean);
  }
  return trimmed ? [trimmed] : [];
}
function escapeYaml(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}
function serializePage(page) {
  const fm = page.frontmatter;
  const yaml = [
    `title: "${escapeYaml(fm.title)}"`,
    `tags: [${fm.tags.map((t) => `"${escapeYaml(t)}"`).join(", ")}]`,
    `created: ${fm.created}`,
    `updated: ${fm.updated}`,
    `sources: [${fm.sources.map((s) => `"${escapeYaml(s)}"`).join(", ")}]`,
    `links: [${fm.links.map((l) => `"${escapeYaml(l)}"`).join(", ")}]`,
    `category: ${fm.category}`,
    `confidence: ${fm.confidence}`,
    `schemaVersion: ${fm.schemaVersion}`
  ].join("\n");
  return `---
${yaml}
---
${page.content}`;
}
function safeWikiPath(wikiDir, filename) {
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return null;
  }
  const filePath = (0, import_path2.join)(wikiDir, filename);
  const resolved = (0, import_path2.resolve)(filePath);
  if (!resolved.startsWith((0, import_path2.resolve)(wikiDir) + import_path2.sep)) {
    return null;
  }
  return filePath;
}
function readPage(root, filename) {
  const wikiDir = getWikiDir(root);
  const filePath = safeWikiPath(wikiDir, filename);
  if (!filePath) return null;
  if (!(0, import_fs3.existsSync)(filePath)) return null;
  try {
    const raw = (0, import_fs3.readFileSync)(filePath, "utf-8");
    const parsed = parseFrontmatter(raw);
    if (!parsed) return null;
    return {
      filename,
      frontmatter: parsed.frontmatter,
      content: parsed.content
    };
  } catch {
    return null;
  }
}
function listPages(root) {
  const wikiDir = getWikiDir(root);
  if (!(0, import_fs3.existsSync)(wikiDir)) return [];
  return (0, import_fs3.readdirSync)(wikiDir).filter((f) => f.endsWith(".md") && !RESERVED_FILES.has(f)).sort();
}
function readAllPages(root) {
  return listPages(root).map((f) => readPage(root, f)).filter((p) => p !== null);
}
function readIndex(root) {
  const indexPath = (0, import_path2.join)(getWikiDir(root), INDEX_FILE);
  if (!(0, import_fs3.existsSync)(indexPath)) return null;
  return (0, import_fs3.readFileSync)(indexPath, "utf-8");
}
function writePageUnsafe(root, page) {
  if (RESERVED_FILES.has(page.filename)) {
    throw new Error(`Cannot write to reserved wiki file: ${page.filename}`);
  }
  const wikiDir = ensureWikiDir(root);
  const filePath = safeWikiPath(wikiDir, page.filename);
  if (!filePath) throw new Error(`Invalid wiki page filename: ${page.filename}`);
  atomicWriteFileSync(filePath, serializePage(page));
}
function updateIndexUnsafe(root) {
  const pages = readAllPages(root);
  const byCategory = /* @__PURE__ */ new Map();
  for (const page of pages) {
    const cat = page.frontmatter.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(page);
  }
  const lines = [
    "# Wiki Index",
    "",
    `> ${pages.length} pages | Last updated: ${(/* @__PURE__ */ new Date()).toISOString()}`,
    ""
  ];
  const sortedCategories = [...byCategory.keys()].sort();
  for (const cat of sortedCategories) {
    lines.push(`## ${cat}`);
    lines.push("");
    for (const page of byCategory.get(cat)) {
      const summary = page.content.split("\n").find((l) => l.trim().length > 0)?.trim() || "";
      const truncated = summary.length > 80 ? summary.slice(0, 77) + "..." : summary;
      lines.push(`- [${page.frontmatter.title}](${page.filename}) \u2014 ${truncated}`);
    }
    lines.push("");
  }
  const wikiDir = ensureWikiDir(root);
  atomicWriteFileSync((0, import_path2.join)(wikiDir, INDEX_FILE), lines.join("\n"));
}
function appendLogUnsafe(root, entry) {
  const wikiDir = ensureWikiDir(root);
  const logPath = (0, import_path2.join)(wikiDir, LOG_FILE);
  const logLine = `## [${entry.timestamp}] ${entry.operation}
- **Pages:** ${entry.pagesAffected.join(", ") || "none"}
- **Summary:** ${entry.summary}

`;
  let existing = "";
  if ((0, import_fs3.existsSync)(logPath)) {
    existing = (0, import_fs3.readFileSync)(logPath, "utf-8");
  } else {
    existing = "# Wiki Log\n\n";
  }
  atomicWriteFileSync(logPath, existing + logLine);
}

// src/hooks/wiki/session-hooks.ts
function loadWikiConfig(root) {
  try {
    const configPath = (0, import_path3.join)(getOmcRoot(root), ".config.json");
    if ((0, import_fs4.existsSync)(configPath)) {
      const raw = JSON.parse((0, import_fs4.readFileSync)(configPath, "utf-8"));
      if (raw && typeof raw === "object") {
        return { ...DEFAULT_WIKI_CONFIG, ...raw };
      }
    }
  } catch {
  }
  return DEFAULT_WIKI_CONFIG;
}
function onSessionStart(data) {
  try {
    const root = data.cwd || process.cwd();
    const wikiDir = getWikiDir(root);
    if (!(0, import_fs4.existsSync)(wikiDir)) {
      return {};
    }
    const pages = listPages(root);
    if (pages.length > 0) {
      const indexContent = readIndex(root);
      if (!indexContent) {
        withWikiLock(root, () => {
          updateIndexUnsafe(root);
        });
      }
    }
    const index = readIndex(root);
    if (!index || pages.length === 0) return {};
    const summary = [
      `[LLM Wiki: ${pages.length} pages at .wiki/]`,
      "",
      "Use wiki_query to search, wiki_list to browse, wiki_read to view pages.",
      "",
      index.split("\n").slice(0, 30).join("\n")
      // First 30 lines of index
    ].join("\n");
    return { additionalContext: summary };
  } catch {
    return {};
  }
}
function onSessionEnd(data) {
  const startTime = Date.now();
  const TIMEOUT_MS = 3e3;
  try {
    const root = data.cwd || process.cwd();
    const config = loadWikiConfig(root);
    if (!config.autoCapture) {
      return { continue: true };
    }
    const wikiDir = getWikiDir(root);
    if (!(0, import_fs4.existsSync)(wikiDir)) {
      return { continue: true };
    }
    const sessionId = data.session_id || `session-${Date.now()}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const dateSlug = now.split("T")[0];
    const filename = `session-log-${dateSlug}-${sessionId.slice(-8)}.md`;
    withWikiLock(root, () => {
      if (Date.now() - startTime > TIMEOUT_MS) return;
      writePageUnsafe(root, {
        filename,
        frontmatter: {
          title: `Session Log ${dateSlug}`,
          tags: ["session-log", "auto-captured"],
          created: now,
          updated: now,
          sources: [sessionId],
          links: [],
          category: "session-log",
          confidence: "medium",
          schemaVersion: WIKI_SCHEMA_VERSION
        },
        content: `
# Session Log ${dateSlug}

Auto-captured session metadata.
Session ID: ${sessionId}

Review and promote significant findings to curated wiki pages via \`wiki_ingest\`.
`
      });
      appendLogUnsafe(root, {
        timestamp: now,
        operation: "ingest",
        pagesAffected: [filename],
        summary: `Auto-captured session log for ${sessionId}`
      });
    });
  } catch {
  }
  return { continue: true };
}
function onPreCompact(data) {
  try {
    const root = data.cwd || process.cwd();
    const pages = listPages(root);
    if (pages.length === 0) return {};
    const allPages = readAllPages(root);
    const categories = [...new Set(allPages.map((p) => p.frontmatter.category))];
    const latestUpdate = allPages.map((p) => p.frontmatter.updated).sort().reverse()[0] || "unknown";
    return {
      additionalContext: `[Wiki: ${pages.length} pages | categories: ${categories.join(", ")} | last updated: ${latestUpdate}]`
    };
  } catch {
    return {};
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  onPreCompact,
  onSessionEnd,
  onSessionStart
});
