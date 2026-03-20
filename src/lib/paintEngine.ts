import type { PaintCommand } from './types';

/**
 * Applies the bucket tool: sets the fill of an SVG element to the given color.
 * Returns a reversible PaintCommand for undo/redo.
 */
export function applyBucket(element: SVGElement, color: string): PaintCommand {
  const previousFill = element.getAttribute('fill') ?? '';

  return {
    type: 'fill',
    redo: () => element.setAttribute('fill', color),
    undo: () => element.setAttribute('fill', previousFill),
  };
}

/**
 * Applies the eraser tool: restores the original fill of an SVG element.
 * Returns a reversible PaintCommand for undo/redo.
 */
export function applyEraser(element: SVGElement, originalColor: string): PaintCommand {
  const previousFill = element.getAttribute('fill') ?? '';

  return {
    type: 'erase',
    redo: () => element.setAttribute('fill', originalColor),
    undo: () => element.setAttribute('fill', previousFill),
  };
}

/**
 * Clears all painted elements by restoring their original fills.
 * Returns a reversible PaintCommand for undo/redo.
 */
export function clearAll(
  elements: SVGElement[],
  originalColors: Map<SVGElement, string>,
): PaintCommand {
  const savedFills = new Map<SVGElement, string>();
  for (const el of elements) {
    savedFills.set(el, el.getAttribute('fill') ?? '');
  }

  return {
    type: 'clear',
    redo: () => {
      for (const el of elements) {
        const original = originalColors.get(el) ?? '';
        el.setAttribute('fill', original);
      }
    },
    undo: () => {
      for (const el of elements) {
        const saved = savedFills.get(el) ?? '';
        el.setAttribute('fill', saved);
      }
    },
  };
}
