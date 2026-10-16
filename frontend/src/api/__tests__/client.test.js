import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ensureCsrfToken, CSRF_TOKEN_URL } from '../client';

describe('ensureCsrfToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Clear any csrf_token cookie left over from other tests.
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throws a descriptive error when the fetch rejects', async () => {
    fetch.mockRejectedValueOnce(new Error('network down'));

    await expect(ensureCsrfToken()).rejects.toThrow(
      /Could not fetch a CSRF token/,
    );
  });

  it('throws an error containing the URL and status on a non-OK response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(ensureCsrfToken()).rejects.toThrow(CSRF_TOKEN_URL);
    await expect(ensureCsrfToken()).rejects.toThrow(/500/);
  });

  it('throws an error mentioning the csrf_token cookie when it is missing', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    await expect(ensureCsrfToken()).rejects.toThrow(/csrf_token/);
  });

  it('does not call fetch when the csrf_token cookie is already present', async () => {
    document.cookie = 'csrf_token=abc123; path=/';

    await ensureCsrfToken();

    expect(fetch).not.toHaveBeenCalled();
  });
});
