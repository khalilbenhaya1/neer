/**
 * sanitize-filename.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Windows-safe filename sanitization.
 *
 * Windows reserves these characters in filenames: < > : " / \ | ? *
 * Session keys like `:memory:` or `agent:main:main` would cause ENOENT
 * when used directly as filesystem names.
 */

// Windows invalid filename characters: < > : " / \ | ? *
// Also replaces forward slash for cross-platform safety.
const INVALID_FILENAME_CHARS_RE = /[:<>"\/\\|?*]/g;
const REPLACEMENT_CHAR = "_";

/**
 * Sanitize a string so it can be safely used as a filename component on
 * Windows and other platforms. Replaces all reserved characters with "_".
 *
 * @example
 *   sanitizeForFilename(":memory:")       // "_memory_"
 *   sanitizeForFilename("agent:main:main") // "agent_main_main"
 */
export function sanitizeForFilename(name: string): string {
    const sanitized = name.replace(INVALID_FILENAME_CHARS_RE, REPLACEMENT_CHAR);
    if (sanitized !== name) {
        console.debug(`[FS SANITIZE] original="${name}" sanitized="${sanitized}"`);
    }
    return sanitized;
}

/**
 * Sanitize ONLY the basename of a full file path.
 * This preserves valid directory separators in the path while sanitizing
 * the filename component.
 */
export function sanitizeBasename(filePath: string): string {
    const dir = filePath.lastIndexOf("/") > -1 || filePath.lastIndexOf("\\") > -1
        ? filePath.slice(0, Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")) + 1)
        : "";
    const base = filePath.slice(dir.length);
    return dir + sanitizeForFilename(base);
}
