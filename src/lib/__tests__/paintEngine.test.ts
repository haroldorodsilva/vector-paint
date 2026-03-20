import { describe, it, expect } from 'vitest';
import { applyBucket, applyEraser, clearAll } from '../paintEngine';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgElement(fill: string): SVGElement {
  const el = document.createElementNS(SVG_NS, 'rect');
  el.setAttribute('fill', fill);
  return el;
}

describe('applyBucket', () => {
  it('sets fill to the given color', () => {
    const el = createSvgElement('white');
    const cmd = applyBucket(el, '#ff0000');
    cmd.redo();
    expect(el.getAttribute('fill')).toBe('#ff0000');
  });

  it('undo restores the previous fill', () => {
    const el = createSvgElement('blue');
    const cmd = applyBucket(el, 'green');
    cmd.redo();
    expect(el.getAttribute('fill')).toBe('green');

    cmd.undo();
    expect(el.getAttribute('fill')).toBe('blue');
  });

  it('redo after undo reapplies the color', () => {
    const el = createSvgElement('blue');
    const cmd = applyBucket(el, 'green');
    cmd.redo();
    cmd.undo();
    cmd.redo();
    expect(el.getAttribute('fill')).toBe('green');
  });

  it('handles element with no fill attribute', () => {
    const el = document.createElementNS(SVG_NS, 'rect');
    const cmd = applyBucket(el, 'red');
    cmd.redo();
    expect(el.getAttribute('fill')).toBe('red');

    cmd.undo();
    expect(el.getAttribute('fill')).toBe('');
  });
});

describe('applyEraser', () => {
  it('restores the original color', () => {
    const el = createSvgElement('red');
    // Simulate painting first
    el.setAttribute('fill', 'blue');

    const cmd = applyEraser(el, 'red');
    cmd.redo();
    expect(el.getAttribute('fill')).toBe('red');
  });

  it('undo restores the painted color', () => {
    const el = createSvgElement('red');
    el.setAttribute('fill', 'blue');

    const cmd = applyEraser(el, 'red');
    cmd.redo();
    expect(el.getAttribute('fill')).toBe('red');

    cmd.undo();
    expect(el.getAttribute('fill')).toBe('blue');
  });

  it('redo after undo restores original again', () => {
    const el = createSvgElement('red');
    el.setAttribute('fill', 'blue');

    const cmd = applyEraser(el, 'red');
    cmd.redo();
    cmd.undo();
    cmd.redo();
    expect(el.getAttribute('fill')).toBe('red');
  });
});

describe('clearAll', () => {
  it('restores all elements to their original colors', () => {
    const el1 = createSvgElement('red');
    const el2 = createSvgElement('blue');
    // Simulate painting
    el1.setAttribute('fill', 'green');
    el2.setAttribute('fill', 'yellow');

    const originals = new Map<SVGElement, string>([
      [el1, 'red'],
      [el2, 'blue'],
    ]);

    const cmd = clearAll([el1, el2], originals);
    cmd.redo();

    expect(el1.getAttribute('fill')).toBe('red');
    expect(el2.getAttribute('fill')).toBe('blue');
  });

  it('undo restores the painted colors', () => {
    const el1 = createSvgElement('red');
    const el2 = createSvgElement('blue');
    el1.setAttribute('fill', 'green');
    el2.setAttribute('fill', 'yellow');

    const originals = new Map<SVGElement, string>([
      [el1, 'red'],
      [el2, 'blue'],
    ]);

    const cmd = clearAll([el1, el2], originals);
    cmd.redo();
    cmd.undo();

    expect(el1.getAttribute('fill')).toBe('green');
    expect(el2.getAttribute('fill')).toBe('yellow');
  });

  it('redo after undo restores originals again', () => {
    const el1 = createSvgElement('red');
    const el2 = createSvgElement('blue');
    el1.setAttribute('fill', 'green');
    el2.setAttribute('fill', 'yellow');

    const originals = new Map<SVGElement, string>([
      [el1, 'red'],
      [el2, 'blue'],
    ]);

    const cmd = clearAll([el1, el2], originals);
    cmd.redo();
    cmd.undo();
    cmd.redo();

    expect(el1.getAttribute('fill')).toBe('red');
    expect(el2.getAttribute('fill')).toBe('blue');
  });

  it('handles empty element list', () => {
    const cmd = clearAll([], new Map());
    // Should not throw
    cmd.redo();
    cmd.undo();
  });
});
