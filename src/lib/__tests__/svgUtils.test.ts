import { describe, it, expect } from 'vitest';
import { validateSvgFile, sanitizeSvg } from '../svgUtils';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Create a minimal File-like object for testing. */
function makeFile(name: string, type: string): File {
  return new File(['<svg></svg>'], name, { type });
}

/* ------------------------------------------------------------------ */
/*  validateSvgFile                                                    */
/* ------------------------------------------------------------------ */

describe('validateSvgFile', () => {
  it('accepts a valid .svg file with correct MIME', () => {
    const result = validateSvgFile(makeFile('drawing.svg', 'image/svg+xml'));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects a .png file', () => {
    const result = validateSvgFile(makeFile('photo.png', 'image/png'));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a .jpg file', () => {
    const result = validateSvgFile(makeFile('photo.jpg', 'image/jpeg'));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a .txt file', () => {
    const result = validateSvgFile(makeFile('notes.txt', 'text/plain'));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a file with .svg extension but wrong MIME type', () => {
    const result = validateSvgFile(makeFile('trick.svg', 'text/plain'));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects a file with correct MIME but wrong extension', () => {
    const result = validateSvgFile(makeFile('trick.png', 'image/svg+xml'));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  sanitizeSvg                                                        */
/* ------------------------------------------------------------------ */

describe('sanitizeSvg', () => {
  it('removes <script> tags', () => {
    const dirty = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><rect/></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('<rect');
  });

  it('removes onclick attributes', () => {
    const dirty = '<svg xmlns="http://www.w3.org/2000/svg"><rect onclick="alert(1)"/></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('<rect');
  });

  it('removes onload attributes', () => {
    const dirty = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('onload');
  });

  it('removes <foreignObject> elements', () => {
    const dirty = '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>hack</div></foreignObject><rect/></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('foreignObject');
    expect(clean).not.toContain('hack');
    expect(clean).toContain('<rect');
  });

  it('removes javascript: URIs from href', () => {
    const dirty = '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect/></a></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('removes javascript: URIs from xlink:href', () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="javascript:alert(1)"><rect/></a></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('preserves valid SVG content unchanged', () => {
    const valid =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
    const clean = sanitizeSvg(valid);
    expect(clean).toContain('circle');
    expect(clean).toContain('cx="50"');
    expect(clean).toContain('fill="red"');
    expect(clean).toContain('viewBox');
  });

  it('handles SVG with multiple dangerous elements at once', () => {
    const dirty = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '  <script>alert("xss")</script>',
      '  <rect onclick="evil()" fill="blue"/>',
      '  <foreignObject><body>bad</body></foreignObject>',
      '  <a href="javascript:void(0)"><text>link</text></a>',
      '  <circle cx="10" cy="10" r="5" fill="green"/>',
      '</svg>',
    ].join('');

    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('foreignObject');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('circle');
    expect(clean).toContain('fill="green"');
  });
});
