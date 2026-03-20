import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { loadFromStorage, saveToStorage } from '../storage';
import type { Category, Drawing } from '../types';

/**
 * Feature: painting-app, Property 3: Round-trip de Persistência
 * Validates: Requirements 2.6, 3.2, 11.1, 11.3
 */

beforeEach(() => {
  localStorage.clear();
});

const arbCategory: fc.Arbitrary<Category> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  emoji: fc.string({ minLength: 1, maxLength: 4 }),
  isDefault: fc.boolean(),
});

const arbDrawing: fc.Arbitrary<Drawing> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  categoryId: fc.uuid(),
  svgContent: fc.string({ minLength: 1, maxLength: 500 }),
  isBuiltIn: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
});

describe('Property 3: Round-trip de Persistência', () => {
  it('saving and loading Category[] produces equivalent data', () => {
    fc.assert(
      fc.property(fc.array(arbCategory, { maxLength: 20 }), (categories) => {
        const key = 'test_categories';
        saveToStorage(key, categories);
        const loaded = loadFromStorage<Category[]>(key, []);
        expect(loaded).toEqual(categories);
      }),
      { numRuns: 100 },
    );
  });

  it('saving and loading Drawing[] produces equivalent data', () => {
    fc.assert(
      fc.property(fc.array(arbDrawing, { maxLength: 20 }), (drawings) => {
        const key = 'test_drawings';
        saveToStorage(key, drawings);
        const loaded = loadFromStorage<Drawing[]>(key, []);
        expect(loaded).toEqual(drawings);
      }),
      { numRuns: 100 },
    );
  });

  it('corrupted JSON returns the default value', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(arbCategory, { maxLength: 5 }),
        (key, defaultValue) => {
          // Write invalid JSON directly to localStorage
          localStorage.setItem(`pintura_${key}`, '{corrupted!!!');
          const loaded = loadFromStorage<Category[]>(key, defaultValue);
          expect(loaded).toEqual(defaultValue);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns default value when localStorage is unavailable', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(arbDrawing, { maxLength: 5 }),
        (key, defaultValue) => {
          const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('SecurityError');
          });
          const loaded = loadFromStorage<Drawing[]>(key, defaultValue);
          expect(loaded).toEqual(defaultValue);
          spy.mockRestore();
        },
      ),
      { numRuns: 100 },
    );
  });
});
