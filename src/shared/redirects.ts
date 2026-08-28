/**
 * Allowlist for `next` redirect parameters.
 *
 * Only same-origin absolute paths are accepted. Protocol-relative URLs
 * (`//evil.com`), backslash-prefixed URLs (`/\\evil.com`), and fully-qualified
 * URLs are rejected. Control characters and over-long strings are also rejected.
 *
 * Use this whenever a route consumes a `next` query parameter (login, logout,
 * password reset, OAuth callbacks) before passing it to `router.push` or
 * `window.location`. Without this guard, an attacker can craft a link like
 * `/auth/login?next=https://evil.com` and use the post-login redirect to
 * phish the user on a legitimate domain.
 */
export function isSafeNextPath(
  value: string | null | undefined,
): value is string {
  if (!value) return false;
  if (value.length > 2048) return false;
  if (!value.startsWith("/")) return false;
  // Block protocol-relative ("//evil.com") and backslash-escaped ("/\evil.com")
  // variants that browsers can interpret as off-origin.
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  // Reject any control characters that could enable header injection.
  if (/[\x00-\x1f]/.test(value)) return false;
  return true;
}