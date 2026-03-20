import { describe, it, expect } from 'vitest';
import { buildCursor } from '../cursor';

describe('buildCursor', () => {
  it('returns a string starting with url(', () => {
    const result = buildCursor('#FF0000');
    expect(result.startsWith('url(')).toBe(true);
  });

  it('contains the provided color in the output', () => {
    const color = '#00FF00';
    const result = buildCursor(color);
    expect(result).toContain(encodeURIComponent(color));
  });

  it('contains crosshair as fallback cursor', () => {
    const result = buildCursor('#0000FF');
    expect(result).toContain('crosshair');
  });
});
