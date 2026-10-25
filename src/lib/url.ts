function isAllowedWebUrl(url: URL): boolean {
  if (url.protocol === 'https:') {
    return true;
  }
  return (
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
  );
}

/** Resolve a server-provided link without allowing non-web or insecure hosts. */
export function resolveHttpUrl(baseUrl: string, value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const resolved = new URL(trimmed, baseUrl);
    return isAllowedWebUrl(resolved) ? resolved.toString() : null;
  } catch {
    return null;
  }
}

/** The public site root, used for "open the college portal" actions. */
export function siteRoot(baseUrl: string): string {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl;
  }
}

/** Host and optional port for display, with a safe fallback for corrupt values. */
export function hostLabel(baseUrl: string): string {
  try {
    return new URL(baseUrl).host || baseUrl;
  } catch {
    return baseUrl;
  }
}
