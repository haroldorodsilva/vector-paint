import { supabase } from './supabase';
import type { Category, Drawing } from './types';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

interface DbCategory {
  id: string;
  name: string;
  emoji: string;
  is_default: boolean;
  created_at: string;
}

function mapCategory(row: DbCategory): Category {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    isDefault: row.is_default,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as DbCategory[]).map(mapCategory);
}

export async function insertCategory(
  name: string,
  emoji: string,
): Promise<Category | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, emoji })
    .select()
    .single();
  if (error || !data) return null;
  return mapCategory(data as DbCategory);
}

export async function updateCategoryInDb(
  id: string,
  name: string,
  emoji: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('categories')
    .update({ name, emoji })
    .eq('id', id);
  return !error;
}

export async function deleteCategoryFromDb(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return !error;
}

// ---------------------------------------------------------------------------
// Drawings
// ---------------------------------------------------------------------------

interface DbDrawing {
  id: string;
  name: string;
  category_id: string | null;
  svg_content: string;
  is_built_in: boolean;
  created_at: string;
}

function mapDrawing(row: DbDrawing): Drawing {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id ?? 'default',
    svgContent: row.svg_content,
    isBuiltIn: row.is_built_in,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function fetchDrawings(): Promise<Drawing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('drawings')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as DbDrawing[]).map(mapDrawing);
}

export async function insertDrawing(
  name: string,
  categoryId: string,
  svgContent: string,
): Promise<Drawing | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('drawings')
    .insert({ name, category_id: categoryId, svg_content: svgContent })
    .select()
    .single();
  if (error || !data) return null;
  return mapDrawing(data as DbDrawing);
}

export async function updateDrawingInDb(
  id: string,
  name: string,
  categoryId: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('drawings')
    .update({ name, category_id: categoryId })
    .eq('id', id);
  return !error;
}

export async function deleteDrawingFromDb(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('drawings').delete().eq('id', id);
  return !error;
}
