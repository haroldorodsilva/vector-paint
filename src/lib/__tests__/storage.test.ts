import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadFromStorage, saveToStorage } from '../storage';

beforeEach(() => {
  localStorage.clear();
});

describe('loadFromStorage', () => {
  it('returns defaultValue when key does not exist', () => {
    expect(loadFromStorage('missing', 42)).toBe(42);
  });

  it('returns parsed value when key exists', () => {
    localStorage.setItem('pintura_nums', JSON.stringify([1, 2, 3]));
    expect(loadFromStorage('nums', [])).toEqual([1, 2, 3]);
  });

  it('returns defaultValue when JSON is corrupted', () => {
    localStorage.setItem('pintura_bad', '{not valid json');
    expect(loadFromStorage('bad', 'fallback')).toBe('fallback');
  });

  it('returns defaultValue when localStorage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadFromStorage('any', 99)).toBe(99);
    spy.mockRestore();
  });

  it('handles stored objects correctly', () => {
    const obj = { name: 'test', items: [1, 2] };
    localStorage.setItem('pintura_obj', JSON.stringify(obj));
    expect(loadFromStorage('obj', {})).toEqual(obj);
  });
});

describe('saveToStorage', () => {
  it('saves value and returns true', () => {
    const result = saveToStorage('key1', { a: 1 });
    expect(result).toBe(true);
    expect(localStorage.getItem('pintura_key1')).toBe(JSON.stringify({ a: 1 }));
  });

  it('returns false when localStorage throws (quota exceeded)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(saveToStorage('key2', 'data')).toBe(false);
    spy.mockRestore();
  });

  it('uses pintura_ prefix on keys', () => {
    saveToStorage('mykey', 'hello');
    expect(localStorage.getItem('pintura_mykey')).toBe('"hello"');
    expect(localStorage.getItem('mykey')).toBeNull();
  });
});
