import type { Drawing } from './types';

// Auto-load SVGs from src/assets/drawings/
const svgAssets = import.meta.glob('../assets/drawings/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Generates a simple unique ID */
function generateId(): string {
  return `drw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Converts a file path to a display name (capitalize, replace dashes/underscores with spaces) */
function filenameToName(path: string): string {
  const file = path.split('/').pop()?.replace(/\.svg$/, '') ?? 'Desenho';
  return file.charAt(0).toUpperCase() + file.slice(1).replace(/-|_/g, ' ');
}

/** Returns built-in drawings loaded from assets */
export function getBuiltInDrawings(): Drawing[] {
  return Object.entries(svgAssets).map(([path, content]) => {
    const filename = path.split('/').pop()?.replace('.svg', '') ?? 'drawing';
    return {
      id: `builtin_${filename}`,
      name: filenameToName(path),
      categoryId: 'default',
      svgContent: content,
      isBuiltIn: true,
      createdAt: 0,
    };
  });
}

/** Combines built-in drawings with user drawings */
export function getAllDrawings(userDrawings: Drawing[]): Drawing[] {
  return [...getBuiltInDrawings(), ...userDrawings];
}

/** Adds a new user drawing to the list */
export function addDrawing(
  drawings: Drawing[],
  name: string,
  categoryId: string,
  svgContent: string,
): Drawing[] {
  const trimmed = name.trim();
  if (trimmed.length === 0) return drawings;

  const newDrawing: Drawing = {
    id: generateId(),
    name: trimmed,
    categoryId,
    svgContent,
    isBuiltIn: false,
    createdAt: Date.now(),
  };
  return [...drawings, newDrawing];
}

/** Updates name and categoryId of an existing drawing. SVG content and id are preserved. */
export function updateDrawing(
  drawings: Drawing[],
  id: string,
  name: string,
  categoryId: string,
): Drawing[] {
  const trimmed = name.trim();
  if (trimmed.length === 0) return drawings;

  return drawings.map((d) =>
    d.id === id ? { ...d, name: trimmed, categoryId } : d,
  );
}

/** Removes a drawing by id */
export function deleteDrawing(drawings: Drawing[], id: string): Drawing[] {
  return drawings.filter((d) => d.id !== id);
}

/** Filters drawings by category. Returns all drawings when categoryId is null. */
export function filterByCategory(
  drawings: Drawing[],
  categoryId: string | null,
): Drawing[] {
  if (categoryId === null) return drawings;
  return drawings.filter((d) => d.categoryId === categoryId);
}
