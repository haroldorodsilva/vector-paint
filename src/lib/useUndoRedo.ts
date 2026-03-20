import { useRef, useState, useCallback } from 'react';
import type { PaintCommand } from './types';

export function useUndoRedo() {
  const undoStack = useRef<PaintCommand[]>([]);
  const redoStack = useRef<PaintCommand[]>([]);
  const [, setVersion] = useState(0);

  const bump = () => setVersion((v) => v + 1);

  const execute = useCallback((cmd: PaintCommand) => {
    cmd.redo();
    undoStack.current.push(cmd);
    redoStack.current = [];
    bump();
  }, []);

  const undo = useCallback(() => {
    const cmd = undoStack.current.pop();
    if (!cmd) return;
    cmd.undo();
    redoStack.current.push(cmd);
    bump();
  }, []);

  const redo = useCallback(() => {
    const cmd = redoStack.current.pop();
    if (!cmd) return;
    cmd.redo();
    undoStack.current.push(cmd);
    bump();
  }, []);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    bump();
  }, []);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return { execute, undo, redo, canUndo, canRedo, clear };
}
