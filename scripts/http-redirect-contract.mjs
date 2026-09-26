const ACCEPTED_REDIRECT_STATUSES = new Set([301, 308]);

/** Return a failure description when an HTTP to HTTPS redirect violates the transport contract. */
export function getHttpRedirectContractError(status, location, expectedHttpUrl) {
  if (!ACCEPTED_REDIRECT_STATUSES.has(status)) {
    return `expected HTTP 301 or 308, got ${status}`;
  }
  if (!location) return 'missing redirect Location';

  let actual;
  let expected;
  try {
    actual = new URL(location);
    expected = new URL(expectedHttpUrl);
  } catch {
    return 'redirect Location or expected URL is invalid';
  }

  if (expected.protocol !== 'http:') return 'expected URL must use HTTP';
  if (actual.protocol !== 'https:') return `expected HTTPS redirect, got ${actual.protocol || 'no scheme'}`;
  if (actual.username || actual.password) return 'redirect Location must not contain credentials';
  if (actual.host !== expected.host) return `expected host ${expected.host}, got ${actual.host}`;
  if (actual.pathname !== expected.pathname) return `expected path ${expected.pathname}, got ${actual.pathname}`;
  if (actual.search !== expected.search) return `expected query ${expected.search}, got ${actual.search}`;
  if (actual.hash) return 'redirect Location must not add a fragment';
  return null;
}
