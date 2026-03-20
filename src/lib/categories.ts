import type { Category, Drawing } from './types';

/** Default category — always present, cannot be removed */
export const DEFAULT_CATEGORY: Category = {
  id: 'default',
  name: 'Sem Categoria',
  emoji: '📁',
  isDefault: true,
};

/** Generates a simple unique ID */
function generateId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Ensures the default category exists in the list.
 * If missing, prepends it.
 */
export function ensureDefaultCategory(categories: Category[]): Category[] {
  const hasDefault = categories.some((c) => c.isDefault);
  if (hasDefault) return categories;
  return [DEFAULT_CATEGORY, ...categories];
}

/**
 * Creates a new category and appends it to the list.
 * Name must be non-empty after trimming.
 */
export function createCategory(
  categories: Category[],
  name: string,
  emoji: string,
): Category[] {
  const trimmed = name.trim();
  if (trimmed.length === 0) return categories;

  const newCategory: Category = {
    id: generateId(),
    name: trimmed,
    emoji,
    isDefault: false,
  };
  return [...categories, newCategory];
}

/**
 * Updates an existing category's name and emoji.
 * Cannot update the default category's isDefault flag.
 * Returns unchanged list if id is not found or name is empty.
 */
export function updateCategory(
  categories: Category[],
  id: string,
  name: string,
  emoji: string,
): Category[] {
  const trimmed = name.trim();
  if (trimmed.length === 0) return categories;

  return categories.map((c) =>
    c.id === id ? { ...c, name: trimmed, emoji } : c,
  );
}

/**
 * Deletes a category by id.
 * The default category (isDefault: true) cannot be deleted.
 * Returns unchanged list if id is not found or is the default category.
 */
export function deleteCategory(
  categories: Category[],
  id: string,
): Category[] {
  const target = categories.find((c) => c.id === id);
  if (!target || target.isDefault) return categories;
  return categories.filter((c) => c.id !== id);
}

/**
 * Reassigns all drawings from a deleted category to the default category.
 */
export function reassignDrawings(
  drawings: Drawing[],
  deletedCategoryId: string,
  defaultCategoryId: string,
): Drawing[] {
  return drawings.map((d) =>
    d.categoryId === deletedCategoryId
      ? { ...d, categoryId: defaultCategoryId }
      : d,
  );
}
