import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithErrorHandling } from './common';

describe('fetchWithErrorHandling', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('returns data on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ msg: 'ok' })
    });
    const data = await fetchWithErrorHandling('/test');
    expect(data).toEqual({ msg: 'ok' });
  });

  it('throws error on failure', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'err',
      json: () => Promise.resolve({ error: 'fail' })
    });
    await expect(fetchWithErrorHandling('/test')).rejects.toThrow('fail');
  });
});

