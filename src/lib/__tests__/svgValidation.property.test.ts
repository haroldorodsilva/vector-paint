import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateSvgFile, sanitizeSvg } from '../svgUtils';

/**
 * Feature: painting-app, Property 4: Validação de Arquivo SVG
 * Validates: Requirements 3.1, 3.3
 */

/** Arbitrary for a filename that ends with .svg (case-insensitive) */
const arbSvgBaseName = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => s.trim().length > 0 && !s.includes('.'));

/** Arbitrary for a non-.svg file extension */
const arbNonSvgExtension = fc
  .string({ minLength: 1, maxLength: 10 })
  .map((s) => s.replace(/\./g, '').toLowerCase())
  .filter((s) => s.length > 0 && s !== 'svg');

/** Arbitrary for a MIME type that is NOT image/svg+xml */
const arbNonSvgMime = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => s !== 'image/svg+xml');

describe('Property 4: Validação de Arquivo SVG', () => {
  it('accepts files with .svg extension AND image/svg+xml MIME type', () => {
    fc.assert(
      fc.property(arbSvgBaseName, (baseName) => {
        const file = new File([], `${baseName}.svg`, { type: 'image/svg+xml' });
        const result = validateSvgFile(file);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it('rejects files with wrong extension regardless of MIME type', () => {
    fc.assert(
      fc.property(arbSvgBaseName, arbNonSvgExtension, (baseName, ext) => {
        const file = new File([], `${baseName}.${ext}`, { type: 'image/svg+xml' });
        const result = validateSvgFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it('rejects files with wrong MIME type regardless of .svg extension', () => {
    fc.assert(
      fc.property(arbSvgBaseName, arbNonSvgMime, (baseName, mime) => {
        const file = new File([], `${baseName}.svg`, { type: mime });
        const result = validateSvgFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it('rejects files with both wrong extension and wrong MIME type', () => {
    fc.assert(
      fc.property(
        arbSvgBaseName,
        arbNonSvgExtension,
        arbNonSvgMime,
        (baseName, ext, mime) => {
          const file = new File([], `${baseName}.${ext}`, { type: mime });
          const result = validateSvgFile(file);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: painting-app, Property 5: Sanitização de SVG Remove Conteúdo Perigoso
 * Validates: Requirements 3.7
 */

/** Arbitrary for a safe SVG body (simple shapes) */
const arbSafeBody = fc.constantFrom(
  '<rect width="10" height="10" fill="red"/>',
  '<circle cx="5" cy="5" r="3" fill="blue"/>',
  '<path d="M0 0 L10 10" stroke="black"/>',
  '',
);

/** Arbitrary for a script element with random content */
const arbScriptElement = fc
  .string({ minLength: 0, maxLength: 50 })
  .map((body) => `<script>${body}</script>`);

/** Arbitrary for a foreignObject element with random content */
const arbForeignObjectElement = fc
  .string({ minLength: 0, maxLength: 50 })
  .map((body) => `<foreignObject>${body}</foreignObject>`);

/** Arbitrary for an on* event handler attribute name */
const arbOnEventName = fc.constantFrom(
  'onclick',
  'onload',
  'onerror',
  'onmouseover',
  'onfocus',
  'onblur',
);

/** Arbitrary for an element with an on* event handler */
const arbOnEventElement = fc
  .tuple(arbOnEventName, fc.string({ minLength: 1, maxLength: 30 }))
  .map(([attr, val]) => `<rect ${attr}="${val}" width="10" height="10"/>`);

/** Arbitrary for an element with a javascript: URI */
const arbJavascriptUri = fc
  .string({ minLength: 0, maxLength: 30 })
  .map((body) => `<a href="javascript:${body}"><rect width="10" height="10"/></a>`);

/** Wrap content in a valid SVG root */
function wrapSvg(content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

describe('Property 5: Sanitização de SVG Remove Conteúdo Perigoso', () => {
  it('removes <script> elements from SVG', () => {
    fc.assert(
      fc.property(arbSafeBody, arbScriptElement, (safe, script) => {
        const raw = wrapSvg(safe + script);
        const result = sanitizeSvg(raw);
        expect(result.toLowerCase()).not.toMatch(/<script[\s>]/);
      }),
      { numRuns: 100 },
    );
  });

  it('removes on* event handler attributes from SVG', () => {
    fc.assert(
      fc.property(arbSafeBody, arbOnEventElement, (safe, el) => {
        const raw = wrapSvg(safe + el);
        const result = sanitizeSvg(raw);
        expect(result).not.toMatch(/\bon\w+\s*=/i);
      }),
      { numRuns: 100 },
    );
  });

  it('removes <foreignObject> elements from SVG', () => {
    fc.assert(
      fc.property(arbSafeBody, arbForeignObjectElement, (safe, fo) => {
        const raw = wrapSvg(safe + fo);
        const result = sanitizeSvg(raw);
        expect(result.toLowerCase()).not.toMatch(/<foreignobject[\s>]/i);
      }),
      { numRuns: 100 },
    );
  });

  it('removes javascript: URIs from SVG', () => {
    fc.assert(
      fc.property(arbSafeBody, arbJavascriptUri, (safe, jsUri) => {
        const raw = wrapSvg(safe + jsUri);
        const result = sanitizeSvg(raw);
        expect(result.toLowerCase()).not.toMatch(/javascript\s*:/);
      }),
      { numRuns: 100 },
    );
  });
});
