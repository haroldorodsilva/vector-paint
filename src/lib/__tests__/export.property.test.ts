import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { buildExportFilename } from '../exportImage';

/**
 * Feature: painting-app, Property 11: Formato do Nome de Arquivo Exportado
 * Validates: Requirement 8.4
 *
 * For any drawing name and any valid date, the generated export filename must
 * follow the pattern `{normalized-name}-{YYYY-MM-DD}.{extension}`, where
 * extension is `png` or `jpg`.
 */

const FILENAME_REGEX = /^[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.(png|jpg)$/;

/** Arbitrary for export format */
const arbFormat = fc.constantFrom<'png' | 'jpg'>('png', 'jpg');

/** Arbitrary for a valid date (no NaN) */
const arbDate = fc.integer({ min: 946684800000, max: 4102444800000 }).map((ts) => new Date(ts));

afterEach(() => {
  vi.useRealTimers();
});

describe('Property 11: Formato do Nome de Arquivo Exportado', () => {
  it('filename matches the pattern {normalized-name}-{YYYY-MM-DD}.{ext} for any name and format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        arbFormat,
        arbDate,
        (name, format, date) => {
          vi.useFakeTimers();
          vi.setSystemTime(date);
          const filename = buildExportFilename(name, format);
          vi.useRealTimers();
          expect(filename).toMatch(FILENAME_REGEX);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('extension matches the requested format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        arbFormat,
        arbDate,
        (name, format, date) => {
          vi.useFakeTimers();
          vi.setSystemTime(date);
          const filename = buildExportFilename(name, format);
          vi.useRealTimers();
          expect(filename.endsWith(`.${format}`)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('empty or special-char-only names produce "desenho" as the name part', () => {
    const specialChars = '!@#$%^&*()+=[]{}|;:,.<>?/~`';
    const arbEmptyish = fc.oneof(
      fc.constant(''),
      fc.constant('   '),
      fc.array(
        fc.integer({ min: 0, max: specialChars.length - 1 }).map((i) => specialChars[i]),
        { minLength: 1, maxLength: 20 },
      ).map((chars) => chars.join('')),
    );

    fc.assert(
      fc.property(arbEmptyish, arbFormat, arbDate, (name, format, date) => {
        vi.useFakeTimers();
        vi.setSystemTime(date);
        const filename = buildExportFilename(name, format);
        vi.useRealTimers();

        // Name part should be 'desenho'
        const withoutExt = filename.replace(/\.(png|jpg)$/, '');
        const namePart = withoutExt.slice(0, -11); // remove '-YYYY-MM-DD'
        expect(namePart).toBe('desenho');

        // Still matches overall pattern
        expect(filename).toMatch(FILENAME_REGEX);
      }),
      { numRuns: 100 },
    );
  });

  it('date portion matches the mocked system date', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        arbFormat,
        arbDate,
        (name, format, date) => {
          vi.useFakeTimers();
          vi.setSystemTime(date);
          const filename = buildExportFilename(name, format);
          vi.useRealTimers();

          const yyyy = date.getFullYear().toString();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          const expectedDateStr = `${yyyy}-${mm}-${dd}`;

          // Extract date portion: last 10 chars before extension
          const withoutExt = filename.replace(/\.(png|jpg)$/, '');
          const datePortion = withoutExt.slice(-10);
          expect(datePortion).toBe(expectedDateStr);
        },
      ),
      { numRuns: 100 },
    );
  });
});
