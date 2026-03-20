import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  DEFAULT_CATEGORY,
  createCategory,
  updateCategory,
  deleteCategory,
  ensureDefaultCategory,
} from '../categories';
import type { Category } from '../types';

/**
 * Feature: painting-app, Property 1: Integridade CRUD de Categorias
 * Validates: Requirements 2.1, 2.2, 2.3
 */

/** Arbitrary for non-empty trimmed category name */
const arbName = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/** Arbitrary for emoji string */
const arbEmoji = fc.string({ minLength: 1, maxLength: 4 });

/** Starting state: list with default category */
const baseCategories: Category[] = [DEFAULT_CATEGORY];

describe('Property 1: Integridade CRUD de Categorias', () => {
  it('created categories exist with correct name and emoji, are non-default, and have unique IDs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(arbName, arbEmoji), { minLength: 1, maxLength: 10 }),
        (entries) => {
          let cats = [...baseCategories];
          const lengthBefore = cats.length;

          for (const [name, emoji] of entries) {
            cats = createCategory(cats, name, emoji);
          }

          // All created categories must exist
          expect(cats.length).toBe(lengthBefore + entries.length);

          const created = cats.slice(lengthBefore);
          for (let i = 0; i < entries.length; i++) {
            const [name, emoji] = entries[i];
            expect(created[i].name).toBe(name.trim());
            expect(created[i].emoji).toBe(emoji);
            expect(created[i].isDefault).toBe(false);
            expect(created[i].id).toBeTruthy();
          }

          // All IDs must be unique
          const ids = created.map((c) => c.id);
          expect(new Set(ids).size).toBe(ids.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('creating with empty name returns unchanged list', () => {
    fc.assert(
      fc.property(
        fc.array(arbEmoji, { minLength: 1, maxLength: 5 }),
        (emojis) => {
          let cats = [...baseCategories];
          for (const emoji of emojis) {
            const result = createCategory(cats, '', emoji);
            expect(result).toBe(cats);
            const resultSpaces = createCategory(cats, '   ', emoji);
            expect(resultSpaces).toBe(cats);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('edited categories keep their ID but reflect new name and emoji', () => {
    fc.assert(
      fc.property(
        arbName,
        arbEmoji,
        arbName,
        arbEmoji,
        (origName, origEmoji, newName, newEmoji) => {
          let cats = createCategory([...baseCategories], origName, origEmoji);
          const created = cats[cats.length - 1];
          const originalId = created.id;

          cats = updateCategory(cats, originalId, newName, newEmoji);
          const updated = cats.find((c) => c.id === originalId)!;

          expect(updated).toBeDefined();
          expect(updated.id).toBe(originalId);
          expect(updated.name).toBe(newName.trim());
          expect(updated.emoji).toBe(newEmoji);
          expect(updated.isDefault).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('deleted non-default categories no longer appear in the list', () => {
    fc.assert(
      fc.property(
        arbName,
        arbEmoji,
        (name, emoji) => {
          let cats = createCategory([...baseCategories], name, emoji);
          const created = cats[cats.length - 1];

          cats = deleteCategory(cats, created.id);

          expect(cats.find((c) => c.id === created.id)).toBeUndefined();
          // Default category must still be present
          expect(cats.find((c) => c.isDefault)).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('default category cannot be deleted', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(arbName, arbEmoji), { maxLength: 5 }),
        (entries) => {
          let cats = [...baseCategories];
          for (const [name, emoji] of entries) {
            cats = createCategory(cats, name, emoji);
          }

          const result = deleteCategory(cats, DEFAULT_CATEGORY.id);

          // List must be unchanged — default still present
          expect(result).toBe(cats);
          expect(result.find((c) => c.id === DEFAULT_CATEGORY.id)).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

import { reassignDrawings } from '../categories';
import type { Drawing } from '../types';

/**
 * Feature: painting-app, Property 2: Remoção de Categoria Reatribui Desenhos
 * Validates: Requirement 2.4
 */

describe('Property 2: Remoção de Categoria Reatribui Desenhos', () => {
  it('all drawings from deleted category are reassigned to default category', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
        fc.array(fc.nat({ max: 20 }), { minLength: 1, maxLength: 8 }),
        (deletedCatId, otherCatIds, drawingCounts) => {
          const defaultCategoryId = 'default';

          // Ensure deletedCatId is not 'default' and not in otherCatIds
          fc.pre(deletedCatId !== defaultCategoryId);
          const uniqueOtherIds = otherCatIds.filter(
            (id) => id !== deletedCatId && id !== defaultCategoryId,
          );

          // Build drawings for the deleted category
          const deletedCatDrawings: Drawing[] = Array.from(
            { length: Math.min(drawingCounts[0], 10) },
            (_, i) => ({
              id: `del-${i}`,
              name: `Drawing ${i}`,
              categoryId: deletedCatId,
              svgContent: '<svg></svg>',
              isBuiltIn: false,
              createdAt: Date.now() + i,
            }),
          );

          // Build drawings for other categories
          const otherDrawings: Drawing[] = uniqueOtherIds.flatMap((catId, ci) => {
            const count = Math.min(drawingCounts[(ci + 1) % drawingCounts.length] || 1, 5);
            return Array.from({ length: count }, (_, i) => ({
              id: `other-${ci}-${i}`,
              name: `Other ${ci}-${i}`,
              categoryId: catId,
              svgContent: '<svg></svg>',
              isBuiltIn: false,
              createdAt: Date.now() + 100 + ci * 10 + i,
            }));
          });

          const allDrawings = [...deletedCatDrawings, ...otherDrawings];
          const result = reassignDrawings(allDrawings, deletedCatId, defaultCategoryId);

          // All drawings from deleted category must now have default categoryId
          for (const d of result) {
            if (deletedCatDrawings.some((dd) => dd.id === d.id)) {
              expect(d.categoryId).toBe(defaultCategoryId);
            }
          }

          // Total count must be preserved
          expect(result.length).toBe(allDrawings.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('drawings belonging to other categories remain unchanged', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (deletedCatId, otherCatId) => {
          const defaultCategoryId = 'default';
          fc.pre(deletedCatId !== defaultCategoryId);
          fc.pre(otherCatId !== deletedCatId);
          fc.pre(otherCatId !== defaultCategoryId);

          const deletedDrawing: Drawing = {
            id: 'del-1',
            name: 'Deleted Drawing',
            categoryId: deletedCatId,
            svgContent: '<svg></svg>',
            isBuiltIn: false,
            createdAt: 1,
          };

          const otherDrawing: Drawing = {
            id: 'other-1',
            name: 'Other Drawing',
            categoryId: otherCatId,
            svgContent: '<svg></svg>',
            isBuiltIn: true,
            createdAt: 2,
          };

          const defaultDrawing: Drawing = {
            id: 'def-1',
            name: 'Default Drawing',
            categoryId: defaultCategoryId,
            svgContent: '<svg></svg>',
            isBuiltIn: false,
            createdAt: 3,
          };

          const allDrawings = [deletedDrawing, otherDrawing, defaultDrawing];
          const result = reassignDrawings(allDrawings, deletedCatId, defaultCategoryId);

          // Other category drawing must be unchanged
          const resultOther = result.find((d) => d.id === 'other-1')!;
          expect(resultOther.categoryId).toBe(otherCatId);
          expect(resultOther.name).toBe(otherDrawing.name);
          expect(resultOther.isBuiltIn).toBe(otherDrawing.isBuiltIn);

          // Default category drawing must be unchanged
          const resultDefault = result.find((d) => d.id === 'def-1')!;
          expect(resultDefault.categoryId).toBe(defaultCategoryId);

          // Deleted category drawing must be reassigned
          const resultDeleted = result.find((d) => d.id === 'del-1')!;
          expect(resultDeleted.categoryId).toBe(defaultCategoryId);
        },
      ),
      { numRuns: 100 },
    );
  });
});
