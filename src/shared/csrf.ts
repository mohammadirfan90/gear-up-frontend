/**
 * Double-submit CSRF helper.
 *
 * The backend is expected to set a non-HttpOnly cookie named `XSRF-TOKEN`
 * containing an opaque token. We read it from `document.cookie` and echo
 * it back on every state-changing request as the `X-CSRF-Token` header.
 * The server compares the cookie value to the header value; if they
 * differ (because a cross-origin attacker can't read the cookie), the
 * request is rejected.
 *
 * Until the server ships the `XSRF-TOKEN` cookie, `getCsrfToken()` returns
 * undefined and the header is omitted — requests continue to work as today.
 */

const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "X-CSRF-Token";

const MUTATING_METHODS = new Set([
  "post",
  "put",
  "patch",
  "delete",
]);

export function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  // Cheap cookie parse: matches `<name>=<value>` between ; or string start and ; or EOL.
  const re = new RegExp(
    "(?:^|;\\s*)" + CSRF_COOKIE_NAME + "=([^;]+)",
  );
  const match = document.cookie.match(re);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
}

export function isMutatingMethod(method: string | undefined): boolean {
  if (!method) return false;
  return MUTATING_METHODS.has(method.toLowerCase());
}

/**
 * Mutates the provided headers object in place to include `X-CSRF-Token`
 * when (a) the request method is state-changing AND (b) the cookie exists.
 *
 * Safe to call in any environment — silently no-ops on the server and when
 * the cookie is absent.
 */
export function applyCsrfHeader(
  method: string | undefined,
  headers: { set(name: string, value: string): unknown },
): void {
  if (!isMutatingMethod(method)) return;
  const token = getCsrfToken();
  if (!token) return;
  headers.set(CSRF_HEADER_NAME, token);
}