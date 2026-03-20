import { describe, it, expect } from 'vitest';
import {
  addDrawing,
  updateDrawing,
  deleteDrawing,
  filterByCategory,
  getAllDrawings,
} from '../drawings';
import type { Drawing } from '../types';

function makeDrawing(overrides: Partial<Drawing> = {}): Drawing {
  return {
    id: 'd1',
    name: 'Gato',
    categoryId: 'c1',
    svgContent: '<svg></svg>',
    isBuiltIn: false,
    createdAt: 1000,
    ...overrides,
  };
}

describe('addDrawing', () => {
  it('appends a new drawing with correct data', () => {
    const result = addDrawing([], 'Gato', 'c1', '<svg>cat</svg>');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Gato');
    expect(result[0].categoryId).toBe('c1');
    expect(result[0].svgContent).toBe('<svg>cat</svg>');
    expect(result[0].isBuiltIn).toBe(false);
    expect(result[0].id).toBeTruthy();
    expect(result[0].createdAt).toBeGreaterThan(0);
  });

  it('trims whitespace from name', () => {
    const result = addDrawing([], '  Peixe  ', 'c1', '<svg/>');
    expect(result[0].name).toBe('Peixe');
  });

  it('does not add drawing with empty name', () => {
    const drawings = [makeDrawing()];
    expect(addDrawing(drawings, '', 'c1', '<svg/>')).toBe(drawings);
    expect(addDrawing(drawings, '   ', 'c1', '<svg/>')).toBe(drawings);
  });

  it('preserves existing drawings', () => {
    const existing = [makeDrawing()];
    const result = addDrawing(existing, 'Novo', 'c2', '<svg/>');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(existing[0]);
  });

  it('generates unique ids', () => {
    const r1 = addDrawing([], 'A', 'c1', '<svg/>');
    const r2 = addDrawing([], 'B', 'c1', '<svg/>');
    expect(r1[0].id).not.toBe(r2[0].id);
  });
});

describe('updateDrawing', () => {
  it('updates name and categoryId of existing drawing', () => {
    const drawings = [makeDrawing({ id: 'd1', name: 'Gato', categoryId: 'c1', svgContent: '<svg>cat</svg>' })];
    const result = updateDrawing(drawings, 'd1', 'Cachorro', 'c2');
    expect(result[0].name).toBe('Cachorro');
    expect(result[0].categoryId).toBe('c2');
    expect(result[0].id).toBe('d1');
    expect(result[0].svgContent).toBe('<svg>cat</svg>');
  });

  it('preserves svgContent and isBuiltIn', () => {
    const drawings = [makeDrawing({ id: 'd1', svgContent: '<svg>original</svg>', isBuiltIn: false })];
    const result = updateDrawing(drawings, 'd1', 'New Name', 'c2');
    expect(result[0].svgContent).toBe('<svg>original</svg>');
    expect(result[0].isBuiltIn).toBe(false);
  });

  it('returns unchanged list when id not found', () => {
    const drawings = [makeDrawing()];
    const result = updateDrawing(drawings, 'nonexistent', 'X', 'c1');
    expect(result).toEqual(drawings);
  });

  it('returns unchanged list when name is empty', () => {
    const drawings = [makeDrawing()];
    expect(updateDrawing(drawings, 'd1', '', 'c1')).toBe(drawings);
    expect(updateDrawing(drawings, 'd1', '   ', 'c1')).toBe(drawings);
  });

  it('trims whitespace from updated name', () => {
    const drawings = [makeDrawing({ id: 'd1' })];
    const result = updateDrawing(drawings, 'd1', '  Peixe  ', 'c1');
    expect(result[0].name).toBe('Peixe');
  });
});

describe('deleteDrawing', () => {
  it('removes a drawing by id', () => {
    const drawings = [
      makeDrawing({ id: 'd1' }),
      makeDrawing({ id: 'd2', name: 'Peixe' }),
    ];
    const result = deleteDrawing(drawings, 'd1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d2');
  });

  it('returns unchanged list when id not found', () => {
    const drawings = [makeDrawing()];
    const result = deleteDrawing(drawings, 'nonexistent');
    expect(result).toHaveLength(1);
  });

  it('handles empty array', () => {
    expect(deleteDrawing([], 'd1')).toEqual([]);
  });
});

describe('filterByCategory', () => {
  const drawings = [
    makeDrawing({ id: 'd1', categoryId: 'c1' }),
    makeDrawing({ id: 'd2', categoryId: 'c2' }),
    makeDrawing({ id: 'd3', categoryId: 'c1' }),
    makeDrawing({ id: 'd4', categoryId: 'c3' }),
  ];

  it('returns only drawings matching the category', () => {
    const result = filterByCategory(drawings, 'c1');
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.categoryId === 'c1')).toBe(true);
  });

  it('returns all drawings when categoryId is null', () => {
    const result = filterByCategory(drawings, null);
    expect(result).toHaveLength(4);
    expect(result).toEqual(drawings);
  });

  it('returns empty array when no drawings match', () => {
    const result = filterByCategory(drawings, 'nonexistent');
    expect(result).toHaveLength(0);
  });

  it('handles empty drawings array', () => {
    expect(filterByCategory([], 'c1')).toEqual([]);
    expect(filterByCategory([], null)).toEqual([]);
  });
});

describe('getAllDrawings', () => {
  it('includes user drawings', () => {
    const userDrawings = [makeDrawing({ id: 'u1' }), makeDrawing({ id: 'u2' })];
    const result = getAllDrawings(userDrawings);
    // Built-in drawings come first (may be 0 if no assets), then user drawings
    expect(result.slice(-2)).toEqual(userDrawings);
  });

  it('returns built-in drawings when no user drawings', () => {
    const result = getAllDrawings([]);
    // All returned drawings should be from built-in (may be empty if no assets)
    expect(result.every((d) => d.isBuiltIn)).toBe(true);
  });
});
