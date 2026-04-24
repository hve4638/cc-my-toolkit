/**
 * Atomic, durable file writes.
 * Self-contained module with no external dependencies.
 */

import * as fsSync from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * Create directory recursively. Tolerates EEXIST races.
 */
export function ensureDirSync(dir: string): void {
  if (fsSync.existsSync(dir)) {
    return;
  }

  try {
    fsSync.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") {
      return;
    }
    throw err;
  }
}

/**
 * Write string content atomically to a file.
 * Uses temp file + atomic rename pattern with fsync for durability.
 */
export function atomicWriteFileSync(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tempPath = path.join(dir, `.${base}.tmp.${crypto.randomUUID()}`);

  let fd: number | null = null;
  let success = false;

  try {
    ensureDirSync(dir);

    fd = fsSync.openSync(tempPath, "wx", 0o600);
    fsSync.writeSync(fd, content, 0, "utf-8");
    fsSync.fsyncSync(fd);
    fsSync.closeSync(fd);
    fd = null;

    fsSync.renameSync(tempPath, filePath);
    success = true;

    // Best-effort directory fsync for rename durability
    try {
      const dirFd = fsSync.openSync(dir, "r");
      try {
        fsSync.fsyncSync(dirFd);
      } finally {
        fsSync.closeSync(dirFd);
      }
    } catch {
      // Some platforms don't support directory fsync
    }
  } finally {
    if (fd !== null) {
      try { fsSync.closeSync(fd); } catch { /* ignore */ }
    }
    if (!success) {
      try { fsSync.unlinkSync(tempPath); } catch { /* ignore */ }
    }
  }
}
