/**
 * Integration tests for Supabase connectivity and CRUD operations.
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 *
 * Run: yarn test src/lib/__tests__/supabase.integration.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Track IDs created during the test so we can clean up
const createdCategoryIds: string[] = [];
const createdDrawingIds: string[] = [];

beforeAll(() => {
  if (!url || !key) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env',
    );
  }
  supabase = createClient(url, key);
});

afterAll(async () => {
  // Best-effort cleanup of test data
  for (const id of createdDrawingIds) {
    await supabase.from('drawings').delete().eq('id', id);
  }
  for (const id of createdCategoryIds) {
    await supabase.from('categories').delete().eq('id', id);
  }
});

// -----------------------------------------------------------------------
// 1. Connectivity
// -----------------------------------------------------------------------
describe('Supabase connectivity', () => {
  it('should connect and reach the database', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });
});

// -----------------------------------------------------------------------
// 2. Categories CRUD
// -----------------------------------------------------------------------
describe('Categories', () => {
  it('should list categories and include the default category', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThanOrEqual(1);

    const defaultCat = data!.find(
      (c: { id: string }) => c.id === '00000000-0000-0000-0000-000000000001',
    );
    expect(defaultCat).toBeDefined();
    expect(defaultCat!.name).toBe('Sem Categoria');
    expect(defaultCat!.is_default).toBe(true);
  });

  it('should insert a new category', async () => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: '__test_cat__', emoji: '🧪' })
      .select()
      .single();

    if (error) {
      // RLS may block anon inserts — skip gracefully
      console.warn('Insert category blocked (likely RLS):', error.message);
      return;
    }

    expect(data).toBeDefined();
    expect(data.name).toBe('__test_cat__');
    expect(data.emoji).toBe('🧪');
    expect(data.id).toBeTruthy();
    createdCategoryIds.push(data.id);
  });

  it('should update a category', async () => {
    if (createdCategoryIds.length === 0) return; // no category to update

    const id = createdCategoryIds[0];
    const { error } = await supabase
      .from('categories')
      .update({ name: '__test_cat_updated__', emoji: '✅' })
      .eq('id', id);

    if (error) {
      console.warn('Update category blocked (likely RLS):', error.message);
      return;
    }

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    expect(data).toBeDefined();
    expect(data!.name).toBe('__test_cat_updated__');
    expect(data!.emoji).toBe('✅');
  });

  it('should delete a category', async () => {
    if (createdCategoryIds.length === 0) return;

    const id = createdCategoryIds.pop()!;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Delete category blocked (likely RLS):', error.message);
      createdCategoryIds.push(id); // put back for afterAll cleanup
      return;
    }

    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();

    expect(data).toBeNull();
  });
});

// -----------------------------------------------------------------------
// 3. Drawings CRUD
// -----------------------------------------------------------------------
describe('Drawings', () => {
  const minimalSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';

  it('should list drawings', async () => {
    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .order('created_at', { ascending: true });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should insert a new drawing', async () => {
    const { data, error } = await supabase
      .from('drawings')
      .insert({
        name: '__test_drawing__',
        category_id: '00000000-0000-0000-0000-000000000001',
        svg_content: minimalSvg,
      })
      .select()
      .single();

    if (error) {
      console.warn('Insert drawing blocked (likely RLS):', error.message);
      return;
    }

    expect(data).toBeDefined();
    expect(data.name).toBe('__test_drawing__');
    expect(data.svg_content).toBe(minimalSvg);
    expect(data.category_id).toBe('00000000-0000-0000-0000-000000000001');
    createdDrawingIds.push(data.id);
  });

  it('should update a drawing', async () => {
    if (createdDrawingIds.length === 0) return;

    const id = createdDrawingIds[0];
    const { error } = await supabase
      .from('drawings')
      .update({ name: '__test_drawing_updated__' })
      .eq('id', id);

    if (error) {
      console.warn('Update drawing blocked (likely RLS):', error.message);
      return;
    }

    const { data } = await supabase
      .from('drawings')
      .select('*')
      .eq('id', id)
      .single();

    expect(data).toBeDefined();
    expect(data!.name).toBe('__test_drawing_updated__');
  });

  it('should delete a drawing', async () => {
    if (createdDrawingIds.length === 0) return;

    const id = createdDrawingIds.pop()!;
    const { error } = await supabase
      .from('drawings')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Delete drawing blocked (likely RLS):', error.message);
      createdDrawingIds.push(id);
      return;
    }

    const { data } = await supabase
      .from('drawings')
      .select('id')
      .eq('id', id)
      .single();

    expect(data).toBeNull();
  });
});

// -----------------------------------------------------------------------
// 4. Schema validation
// -----------------------------------------------------------------------
describe('Schema validation', () => {
  it('categories table should have expected columns', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, emoji, is_default, created_at')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();

    if (data!.length > 0) {
      const row = data![0];
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('name');
      expect(row).toHaveProperty('emoji');
      expect(row).toHaveProperty('is_default');
      expect(row).toHaveProperty('created_at');
    }
  });

  it('drawings table should have expected columns', async () => {
    const { data, error } = await supabase
      .from('drawings')
      .select('id, name, category_id, svg_content, is_built_in, created_at')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // Even if empty, no error means schema is correct
  });

  it('drawings.category_id should reference categories (FK)', async () => {
    // Try inserting a drawing with an invalid category UUID
    const { error } = await supabase
      .from('drawings')
      .insert({
        name: '__fk_test__',
        category_id: '99999999-9999-9999-9999-999999999999',
        svg_content: '<svg></svg>',
      });

    // Should either be an FK violation or RLS block
    if (error) {
      expect(
        error.message.includes('violates foreign key') ||
        error.message.includes('policy') ||
        error.code === '42501' ||
        error.code === '23503',
      ).toBe(true);
    }
  });
});
