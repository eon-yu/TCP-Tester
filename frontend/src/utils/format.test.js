import { describe, it, expect } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('formats ISO string to locale string', () => {
    const iso = '2024-01-01T00:00:00Z';
    const formatted = formatDate(iso);
    expect(formatted).toBe(new Date(iso).toLocaleString());
  });
});

