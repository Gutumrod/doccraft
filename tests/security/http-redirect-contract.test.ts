import { describe, expect, it } from 'vitest';
import { getHttpRedirectContractError } from '../../scripts/http-redirect-contract.mjs';

describe('HTTP to HTTPS transport contract', () => {
  const request = 'http://doccraft.wstera.com/a/b?x=1&y=2';

  it.each([301, 308])('accepts status %s with the same host, path, and query over HTTPS', (status) => {
    expect(
      getHttpRedirectContractError(status, 'https://doccraft.wstera.com/a/b?x=1&y=2', request),
    ).toBeNull();
  });

  it.each([
    [302, 'https://doccraft.wstera.com/a/b?x=1&y=2'],
    [307, 'https://doccraft.wstera.com/a/b?x=1&y=2'],
    [301, 'https://other.wstera.com/a/b?x=1&y=2'],
    [308, 'https://doccraft.wstera.com/other?x=1&y=2'],
    [308, 'https://doccraft.wstera.com/a/b?x=1'],
    [308, 'http://doccraft.wstera.com/a/b?x=1&y=2'],
    [308, null],
  ])('rejects status %s with invalid Location %s', (status, location) => {
    expect(getHttpRedirectContractError(status, location, request)).toEqual(expect.any(String));
  });
});
