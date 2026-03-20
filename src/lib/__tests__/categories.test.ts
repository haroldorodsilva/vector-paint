import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CATEGORY,
  ensureDefaultCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignDrawings,
} from '../categories';
import type { Category, Drawing } from '../types';

const cat1: Category = { id: 'c1', name: 'Animais', emoji: '🐱', isDefault: false };
const cat2: Category = { id: 'c2', name: 'Veículos', emoji: '🚗', isDefault: false };

function makeDrawing(overrides: Partial<Drawing> = {}): Drawing {
  return {
    id: 'd1',
    name: 'Gato',
    categoryId: 'c1',
    svgContent: '<svg></svg>',
    isBuiltIn: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('DEFAULT_CATEGORY', () => {
  it('has id "default" and isDefault true', () => {
    expect(DEFAULT_CATEGORY.id).toBe('default');
    expect(DEFAULT_CATEGORY.isDefault).toBe(true);
    expect(DEFAULT_CATEGORY.name).toBe('Sem Categoria');
  });
});

describe('ensureDefaultCategory', () => {
  it('returns list unchanged when default category exists', () => {
    const cats = [DEFAULT_CATEGORY, cat1];
    expect(ensureDefaultCategory(cats)).toBe(cats);
  });

  it('prepends default category when missing', () => {
    const cats = [cat1, cat2];
    const result = ensureDefaultCategory(cats);
    expect(result).toHaveLength(3);
    expect(result[0].isDefault).toBe(true);
    expect(result[0].id).toBe('default');
  });

  it('prepends default category to empty list', () => {
    const result = ensureDefaultCategory([]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(DEFAULT_CATEGORY);
  });
});

describe('createCategory', () => {
  it('appends a new category with correct data', () => {
    const result = createCategory([DEFAULT_CATEGORY], 'Animais', '🐱');
    expect(result).toHaveLength(2);
    const created = result[1];
    expect(created.name).toBe('Animais');
    expect(created.emoji).toBe('🐱');
    expect(created.isDefault).toBe(false);
    expect(created.id).toBeTruthy();
  });

  it('trims whitespace from name', () => {
    const result = createCategory([], '  Natureza  ', '🌿');
    expect(result[0].name).toBe('Natureza');
  });

  it('does not create category with empty name', () => {
    const cats = [DEFAULT_CATEGORY];
    expect(createCategory(cats, '', '🐱')).toBe(cats);
    expect(createCategory(cats, '   ', '🐱')).toBe(cats);
  });

  it('generates unique ids for each creation', () => {
    const r1 = createCategory([], 'A', '🅰️');
    const r2 = createCategory([], 'B', '🅱️');
    expect(r1[0].id).not.toBe(r2[0].id);
  });
});

describe('updateCategory', () => {
  it('updates name and emoji of existing category', () => {
    const cats = [DEFAULT_CATEGORY, cat1];
    const result = updateCategory(cats, 'c1', 'Pets', '🐶');
    expect(result[1].name).toBe('Pets');
    expect(result[1].emoji).toBe('🐶');
    expect(result[1].id).toBe('c1');
  });

  it('returns unchanged list when id not found', () => {
    const cats = [DEFAULT_CATEGORY, cat1];
    const result = updateCategory(cats, 'nonexistent', 'X', '❌');
    expect(result).toEqual(cats);
  });

  it('returns unchanged list when name is empty', () => {
    const cats = [DEFAULT_CATEGORY, cat1];
    expect(updateCategory(cats, 'c1', '', '🐶')).toBe(cats);
    expect(updateCategory(cats, 'c1', '   ', '🐶')).toBe(cats);
  });

  it('trims whitespace from updated name', () => {
    const cats = [cat1];
    const result = updateCategory(cats, 'c1', '  Pets  ', '🐶');
    expect(result[0].name).toBe('Pets');
  });

  it('preserves isDefault flag', () => {
    const cats = [DEFAULT_CATEGORY];
    const result = updateCategory(cats, 'default', 'Renamed', '📂');
    expect(result[0].isDefault).toBe(true);
    expect(result[0].name).toBe('Renamed');
  });
});

describe('deleteCategory', () => {
  it('removes a non-default category', () => {
    const cats = [DEFAULT_CATEGORY, cat1, cat2];
    const result = deleteCategory(cats, 'c1');
    expect(result).toHaveLength(2);
    expect(result.find((c) => c.id === 'c1')).toBeUndefined();
  });

  it('does not remove the default category', () => {
    const cats = [DEFAULT_CATEGORY, cat1];
    const result = deleteCategory(cats, 'default');
    expect(result).toBe(cats);
    expect(result).toHaveLength(2);
  });

  it('returns unchanged list when id not found', () => {
    const cats = [DEFAULT_CATEGORY, cat1];
    const result = deleteCategory(cats, 'nonexistent');
    expect(result).toBe(cats);
  });
});

describe('reassignDrawings', () => {
  it('reassigns drawings from deleted category to default', () => {
    const drawings = [
      makeDrawing({ id: 'd1', categoryId: 'c1' }),
      makeDrawing({ id: 'd2', categoryId: 'c2' }),
      makeDrawing({ id: 'd3', categoryId: 'c1' }),
    ];
    const result = reassignDrawings(drawings, 'c1', 'default');
    expect(result[0].categoryId).toBe('default');
    expect(result[1].categoryId).toBe('c2');
    expect(result[2].categoryId).toBe('default');
  });

  it('returns unchanged drawings when no matches', () => {
    const drawings = [makeDrawing({ categoryId: 'c2' })];
    const result = reassignDrawings(drawings, 'c1', 'default');
    expect(result[0].categoryId).toBe('c2');
  });

  it('handles empty drawings array', () => {
    expect(reassignDrawings([], 'c1', 'default')).toEqual([]);
  });

  it('preserves all other drawing fields', () => {
    const drawing = makeDrawing({ id: 'd1', categoryId: 'c1', name: 'Gato', svgContent: '<svg>cat</svg>' });
    const result = reassignDrawings([drawing], 'c1', 'default');
    expect(result[0].id).toBe('d1');
    expect(result[0].name).toBe('Gato');
    expect(result[0].svgContent).toBe('<svg>cat</svg>');
    expect(result[0].categoryId).toBe('default');
  });
});
