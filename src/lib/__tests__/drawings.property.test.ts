import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterByCategory, addDrawing, updateDrawing, deleteDrawing } from '../drawings';
import type { Drawing } from '../types';

/**
 * Feature: painting-app, Property 6: Filtro por Categoria Retorna Apenas Desenhos da Categoria
 * Validates: Requirement 4.2
 */

/** Arbitrary for a Drawing with a given categoryId */
const arbDrawing = (categoryId: fc.Arbitrary<string>): fc.Arbitrary<Drawing> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    categoryId,
    svgContent: fc.constant('<svg></svg>'),
    isBuiltIn: fc.boolean(),
    createdAt: fc.nat(),
  });

/** Arbitrary for a non-empty category ID */
const arbCategoryId = fc.stringMatching(/^[a-z0-9_-]{1,20}$/);

describe('Property 6: Filtro por Categoria Retorna Apenas Desenhos da Categoria', () => {
  it('all returned drawings belong exclusively to the filtered category', () => {
    fc.assert(
      fc.property(
        arbCategoryId,
        fc.array(arbCategoryId, { minLength: 0, maxLength: 5 }),
        fc.nat({ max: 10 }),
        fc.array(fc.nat({ max: 10 }), { minLength: 0, maxLength: 5 }),
        (targetCatId, otherCatIds, targetCount, otherCounts) => {
          const uniqueOtherIds = otherCatIds.filter((id) => id !== targetCatId);

          // Build drawings for the target category
          const targetDrawings: Drawing[] = Array.from({ length: targetCount }, (_, i) => ({
            id: `target-${i}`,
            name: `Target ${i}`,
            categoryId: targetCatId,
            svgContent: '<svg></svg>',
            isBuiltIn: false,
            createdAt: i,
          }));

          // Build drawings for other categories
          const otherDrawings: Drawing[] = uniqueOtherIds.flatMap((catId, ci) => {
            const count = Math.min(otherCounts[ci] ?? 1, 5);
            return Array.from({ length: count }, (_, i) => ({
              id: `other-${ci}-${i}`,
              name: `Other ${ci}-${i}`,
              categoryId: catId,
              svgContent: '<svg></svg>',
              isBuiltIn: true,
              createdAt: 100 + ci * 10 + i,
            }));
          });

          const allDrawings = [...targetDrawings, ...otherDrawings];
          const result = filterByCategory(allDrawings, targetCatId);

          // All returned drawings must belong to the target category
          for (const d of result) {
            expect(d.categoryId).toBe(targetCatId);
          }

          // No drawings from other categories should be included
          expect(result.length).toBe(targetCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('filtering with null returns all drawings unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(arbDrawing(arbCategoryId), { minLength: 0, maxLength: 20 }),
        (drawings) => {
          const result = filterByCategory(drawings, null);
          expect(result).toBe(drawings);
          expect(result.length).toBe(drawings.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('result is always a subset of the original list', () => {
    fc.assert(
      fc.property(
        fc.array(arbDrawing(arbCategoryId), { minLength: 0, maxLength: 20 }),
        arbCategoryId,
        (drawings, categoryId) => {
          const result = filterByCategory(drawings, categoryId);

          // Every returned drawing must exist in the original list
          for (const d of result) {
            expect(drawings).toContain(d);
          }

          // Result can never be larger than the original
          expect(result.length).toBeLessThanOrEqual(drawings.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: painting-app, Property 13: Integridade CRUD de Desenhos
 * Validates: Requirements 12.1, 12.2
 */

/** Arbitrary for a non-empty trimmed name */
const arbName = fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0);

/** Arbitrary for a category ID */
const arbCatId = fc.stringMatching(/^[a-z0-9_-]{1,20}$/);

/** Arbitrary for SVG content */
const arbSvgContent = fc.constantFrom(
  '<svg><rect/></svg>',
  '<svg><circle/></svg>',
  '<svg><path d="M0 0"/></svg>',
);

describe('Property 13: Integridade CRUD de Desenhos', () => {
  it('adding a drawing makes it appear in the list with correct data', () => {
    fc.assert(
      fc.property(arbName, arbCatId, arbSvgContent, (name, categoryId, svgContent) => {
        const initial: Drawing[] = [];
        const result = addDrawing(initial, name, categoryId, svgContent);

        expect(result.length).toBe(1);
        const added = result[0];
        expect(added.name).toBe(name.trim());
        expect(added.categoryId).toBe(categoryId);
        expect(added.svgContent).toBe(svgContent);
        expect(added.isBuiltIn).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('deleting a drawing removes it from the list', () => {
    fc.assert(
      fc.property(arbName, arbCatId, arbSvgContent, (name, categoryId, svgContent) => {
        const afterAdd = addDrawing([], name, categoryId, svgContent);
        const addedId = afterAdd[0].id;

        const afterDelete = deleteDrawing(afterAdd, addedId);

        expect(afterDelete.length).toBe(0);
        expect(afterDelete.find((d) => d.id === addedId)).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it('updating a drawing changes name and categoryId but preserves id and svgContent', () => {
    fc.assert(
      fc.property(
        arbName,
        arbCatId,
        arbSvgContent,
        arbName,
        arbCatId,
        (name, categoryId, svgContent, newName, newCategoryId) => {
          const afterAdd = addDrawing([], name, categoryId, svgContent);
          const original = afterAdd[0];

          const afterUpdate = updateDrawing(afterAdd, original.id, newName, newCategoryId);
          const updated = afterUpdate.find((d) => d.id === original.id);

          expect(updated).toBeDefined();
          expect(updated!.id).toBe(original.id);
          expect(updated!.svgContent).toBe(original.svgContent);
          expect(updated!.name).toBe(newName.trim());
          expect(updated!.categoryId).toBe(newCategoryId);
        },
      ),
      { numRuns: 100 },
    );
  });
});
