export type WebUrlResult = { ok: true; url: string } | { ok: false; error: string };

// "javascript:x", "ftp://x", "mailto:x" have a scheme; "localhost:3000" and "site.com:80/path" are host:port.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d+(?:[/?#]|$))/i;

/**
 * Turn what a user typed into an http(s) link. A bare address like `example.com/tool` gets `https://`;
 * any other scheme (javascript:, ftp:, file:, ...) is refused, as is text that cannot be a website address.
 */
export function toWebUrl(input: string): WebUrlResult {
  const raw = (input ?? '').trim();
  if (!raw) return { ok: false, error: 'Enter a web address.' };
  if (/\s/.test(raw)) return { ok: false, error: 'A web address cannot contain spaces.' };

  let candidate = raw;
  if (HAS_SCHEME.test(raw)) {
    if (!/^https?:\/\//i.test(raw)) return { ok: false, error: 'Only http:// and https:// links are supported.' };
  } else {
    candidate = `https://${raw}`;
  }

  try {
    const host = new URL(candidate).hostname;
    const plausible = host === 'localhost' || host.includes('.') || host.startsWith('[');
    if (!plausible) return { ok: false, error: 'That does not look like a website address (for example example.com).' };
    return { ok: true, url: candidate };
  } catch {
    return { ok: false, error: 'That is not a valid web address.' };
  }
}
