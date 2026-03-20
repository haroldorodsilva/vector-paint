import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildExportFilename } from '../exportImage';

describe('buildExportFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('produces correct format for a normal name', () => {
    expect(buildExportFilename('Gato', 'png')).toBe('gato-2025-01-15.png');
  });

  it('replaces spaces with dashes', () => {
    expect(buildExportFilename('Meu Desenho Legal', 'png')).toBe('meu-desenho-legal-2025-01-15.png');
  });

  it('removes special characters', () => {
    expect(buildExportFilename('Gato!@#$%', 'png')).toBe('gato-2025-01-15.png');
  });

  it('handles mixed special characters and spaces', () => {
    expect(buildExportFilename('Meu Gato & Cão!', 'jpg')).toBe('meu-gato-co-2025-01-15.jpg');
  });

  it('works with png extension', () => {
    const result = buildExportFilename('Sol', 'png');
    expect(result).toMatch(/\.png$/);
  });

  it('works with jpg extension', () => {
    const result = buildExportFilename('Sol', 'jpg');
    expect(result).toMatch(/\.jpg$/);
  });

  it('uses YYYY-MM-DD date format', () => {
    const result = buildExportFilename('Teste', 'png');
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(result).toContain('2025-01-15');
  });

  it('falls back to "desenho" for empty name', () => {
    expect(buildExportFilename('', 'png')).toBe('desenho-2025-01-15.png');
  });

  it('falls back to "desenho" for name with only special characters', () => {
    expect(buildExportFilename('!!!', 'jpg')).toBe('desenho-2025-01-15.jpg');
  });

  it('collapses multiple spaces into single dash', () => {
    expect(buildExportFilename('Meu   Desenho', 'png')).toBe('meu-desenho-2025-01-15.png');
  });
});
