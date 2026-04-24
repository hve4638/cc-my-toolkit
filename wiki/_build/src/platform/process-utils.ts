/**
 * Process Utilities
 */

/**
 * Check if a process is alive.
 * Works cross-platform by attempting signal 0.
 * EPERM means the process exists but we lack permission to signal it.
 */
export function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as NodeJS.ErrnoException).code === 'EPERM') {
      return true;
    }
    return false;
  }
}
