import { useState } from 'react';

const PREFIX = 'pintura_';

/**
 * Reads and parses a value from localStorage with the pintura_ prefix.
 * Returns defaultValue if localStorage is unavailable, key is missing, or JSON is corrupted.
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Saves a value to localStorage with the pintura_ prefix.
 * Returns false if localStorage is unavailable or quota is exceeded.
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * React hook for persisting state in localStorage with the pintura_ prefix.
 * Handles localStorage unavailable (private mode, quota exceeded) and corrupted JSON gracefully.
 */
export function useStorage<T>(key: string, defaultValue: T): {
  data: T;
  save: (value: T) => void;
  isAvailable: boolean;
} {
  const [isAvailable] = useState<boolean>(() => {
    try {
      const testKey = PREFIX + '__test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  });

  const [data, setData] = useState<T>(() => loadFromStorage(key, defaultValue));

  const save = (value: T) => {
    setData(value);
    saveToStorage(key, value);
  };

  return { data, save, isAvailable };
}
