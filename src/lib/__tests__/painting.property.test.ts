import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { applyBucket, applyEraser, clearAll } from '../paintEngine';
import type { PaintCommand } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Arbitrary for valid hex color strings */
const arbHexColor = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  )
  .map(
    ([r, g, b]) =>
      `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
  );

/**
 * Simple non-React undo/redo manager that mirrors the logic of useUndoRedo hook.
 * Used for testing the command pattern without React dependencies.
 */
class UndoRedoManager {
  private undoStack: PaintCommand[] = [];
  private redoStack: PaintCommand[] = [];

  execute(cmd: PaintCommand): void {
    cmd.redo();
    this.undoStack.push(cmd);
    this.redoStack = [];
  }

  undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo();
    this.redoStack.push(cmd);
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    cmd.redo();
    this.undoStack.push(cmd);
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

/**
 * Feature: painting-app, Property 9: Undo/Redo Round-trip
 * Validates: Requirements 5.8, 5.9
 */
describe('Property 9: Undo/Redo Round-trip', () => {
  it('execute → undo → redo produces the same fill as execute alone', () => {
    fc.assert(
      fc.property(arbHexColor, arbHexColor, (originalColor, paintColor) => {
        // Setup: two identical elements with the same original color
        const elDirect = document.createElementNS(SVG_NS, 'rect');
        elDirect.setAttribute('fill', originalColor);

        const elRoundTrip = document.createElementNS(SVG_NS, 'rect');
        elRoundTrip.setAttribute('fill', originalColor);

        const manager = new UndoRedoManager();

        // Direct path: just execute the command
        const cmdDirect = applyBucket(elDirect, paintColor);
        cmdDirect.redo();

        // Round-trip path: execute → undo → redo
        const cmdRoundTrip = applyBucket(elRoundTrip, paintColor);
        manager.execute(cmdRoundTrip);
        manager.undo();
        manager.redo();

        // Both elements must have the same fill
        expect(elRoundTrip.getAttribute('fill')).toBe(elDirect.getAttribute('fill'));
      }),
      { numRuns: 100 },
    );
  });

  it('undo on empty stack does not alter element state', () => {
    fc.assert(
      fc.property(arbHexColor, (originalColor) => {
        const el = document.createElementNS(SVG_NS, 'rect');
        el.setAttribute('fill', originalColor);

        const manager = new UndoRedoManager();

        // Undo with no prior commands
        manager.undo();

        // State must be unchanged
        expect(el.getAttribute('fill')).toBe(originalColor);
        expect(manager.canUndo).toBe(false);
        expect(manager.canRedo).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('execute → undo restores original fill for a sequence of commands', () => {
    fc.assert(
      fc.property(
        arbHexColor,
        fc.array(arbHexColor, { minLength: 1, maxLength: 10 }),
        (originalColor, paintColors) => {
          const el = document.createElementNS(SVG_NS, 'rect');
          el.setAttribute('fill', originalColor);

          const manager = new UndoRedoManager();

          // Execute all commands
          for (const color of paintColors) {
            const cmd = applyBucket(el, color);
            manager.execute(cmd);
          }

          // Undo all commands
          for (let i = 0; i < paintColors.length; i++) {
            manager.undo();
          }

          // Should be back to original
          expect(el.getAttribute('fill')).toBe(originalColor);
          expect(manager.canUndo).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('redo after undo restores the last painted color in a sequence', () => {
    fc.assert(
      fc.property(
        arbHexColor,
        fc.array(arbHexColor, { minLength: 1, maxLength: 10 }),
        (originalColor, paintColors) => {
          const el = document.createElementNS(SVG_NS, 'rect');
          el.setAttribute('fill', originalColor);

          const manager = new UndoRedoManager();

          // Execute all commands
          for (const color of paintColors) {
            const cmd = applyBucket(el, color);
            manager.execute(cmd);
          }

          const lastColor = paintColors[paintColors.length - 1];

          // Undo all, then redo all
          for (let i = 0; i < paintColors.length; i++) {
            manager.undo();
          }
          for (let i = 0; i < paintColors.length; i++) {
            manager.redo();
          }

          // Should match the last painted color
          expect(el.getAttribute('fill')).toBe(lastColor);
          expect(manager.canRedo).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('new execute after undo clears redo stack', () => {
    fc.assert(
      fc.property(arbHexColor, arbHexColor, arbHexColor, (original, color1, color2) => {
        const el = document.createElementNS(SVG_NS, 'rect');
        el.setAttribute('fill', original);

        const manager = new UndoRedoManager();

        // Execute, undo, then execute a new command
        manager.execute(applyBucket(el, color1));
        manager.undo();
        expect(manager.canRedo).toBe(true);

        manager.execute(applyBucket(el, color2));

        // Redo stack must be cleared
        expect(manager.canRedo).toBe(false);
        expect(el.getAttribute('fill')).toBe(color2);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: painting-app, Property 7: Balde Preenche Elemento com Cor Selecionada
 * Validates: Requirements 5.5
 */
describe('Property 7: Balde Preenche Elemento com Cor Selecionada', () => {
  const arbSvgTagName = fc.constantFrom('rect', 'circle', 'path', 'ellipse');

  it('applyBucket sets element fill to the selected color after redo()', () => {
    fc.assert(
      fc.property(arbSvgTagName, arbHexColor, arbHexColor, (tagName, originalColor, selectedColor) => {
        const el = document.createElementNS(SVG_NS, tagName);
        el.setAttribute('fill', originalColor);

        const cmd = applyBucket(el, selectedColor);
        cmd.redo();

        expect(el.getAttribute('fill')).toBe(selectedColor);
      }),
      { numRuns: 100 },
    );
  });

  it('applyBucket works on elements with no initial fill', () => {
    fc.assert(
      fc.property(arbSvgTagName, arbHexColor, (tagName, selectedColor) => {
        const el = document.createElementNS(SVG_NS, tagName);
        // No fill attribute set

        const cmd = applyBucket(el, selectedColor);
        cmd.redo();

        expect(el.getAttribute('fill')).toBe(selectedColor);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: painting-app, Property 8: Pintar e Apagar Restaura Original
 * Validates: Requirements 5.7, 7.1
 */
describe('Property 8: Pintar e Apagar Restaura Original', () => {
  const arbSvgTagName = fc.constantFrom('rect', 'circle', 'path', 'ellipse');

  it('applyBucket then applyEraser restores the original fill', () => {
    fc.assert(
      fc.property(arbSvgTagName, arbHexColor, arbHexColor, (tagName, originalColor, paintColor) => {
        const el = document.createElementNS(SVG_NS, tagName);
        el.setAttribute('fill', originalColor);

        // Paint with bucket
        const bucketCmd = applyBucket(el, paintColor);
        bucketCmd.redo();

        // Erase to restore original
        const eraserCmd = applyEraser(el, originalColor);
        eraserCmd.redo();

        expect(el.getAttribute('fill')).toBe(originalColor);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: painting-app, Property 10: Limpar Tudo Restaura Todos os Originais
 * Validates: Requirements 7.2
 */
describe('Property 10: Limpar Tudo Restaura Todos os Originais', () => {
  it('clearAll restores all elements to their original fills after painting', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(arbHexColor, arbHexColor),
          { minLength: 1, maxLength: 20 },
        ),
        (colorPairs) => {
          // Create N elements with original colors
          const elements: SVGElement[] = [];
          const originalColors = new Map<SVGElement, string>();

          for (const [originalColor] of colorPairs) {
            const el = document.createElementNS(SVG_NS, 'rect');
            el.setAttribute('fill', originalColor);
            elements.push(el);
            originalColors.set(el, originalColor);
          }

          // Paint each element with a random paint color
          for (let i = 0; i < colorPairs.length; i++) {
            const [, paintColor] = colorPairs[i];
            const cmd = applyBucket(elements[i], paintColor);
            cmd.redo();
          }

          // Execute clearAll and redo it
          const clearCmd = clearAll(elements, originalColors);
          clearCmd.redo();

          // All elements must have their original fills restored
          for (let i = 0; i < colorPairs.length; i++) {
            const [originalColor] = colorPairs[i];
            expect(elements[i].getAttribute('fill')).toBe(originalColor);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
