import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';
import type { PaintCommand } from '../types';

function makeCommand(overrides: Partial<PaintCommand> = {}): PaintCommand {
  return {
    type: 'fill',
    undo: vi.fn(),
    redo: vi.fn(),
    ...overrides,
  };
}

describe('useUndoRedo', () => {
  it('starts with canUndo and canRedo false', () => {
    const { result } = renderHook(() => useUndoRedo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('execute adds to undo stack and calls redo()', () => {
    const { result } = renderHook(() => useUndoRedo());
    const cmd = makeCommand();

    act(() => result.current.execute(cmd));

    expect(cmd.redo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo calls command.undo() and moves to redo stack', () => {
    const { result } = renderHook(() => useUndoRedo());
    const cmd = makeCommand();

    act(() => result.current.execute(cmd));
    act(() => result.current.undo());

    expect(cmd.undo).toHaveBeenCalledOnce();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo calls command.redo() and moves back to undo stack', () => {
    const { result } = renderHook(() => useUndoRedo());
    const cmd = makeCommand();

    act(() => result.current.execute(cmd));
    act(() => result.current.undo());
    act(() => result.current.redo());

    // redo called once during execute, once during redo
    expect(cmd.redo).toHaveBeenCalledTimes(2);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('execute clears redo stack', () => {
    const { result } = renderHook(() => useUndoRedo());
    const cmd1 = makeCommand();
    const cmd2 = makeCommand();

    act(() => result.current.execute(cmd1));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.execute(cmd2));
    expect(result.current.canRedo).toBe(false);
  });

  it('undo with empty stack does nothing', () => {
    const { result } = renderHook(() => useUndoRedo());

    act(() => result.current.undo());

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('redo with empty stack does nothing', () => {
    const { result } = renderHook(() => useUndoRedo());

    act(() => result.current.redo());

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('clear empties both stacks', () => {
    const { result } = renderHook(() => useUndoRedo());
    const cmd1 = makeCommand();
    const cmd2 = makeCommand();

    act(() => result.current.execute(cmd1));
    act(() => result.current.execute(cmd2));
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.clear());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('canUndo/canRedo reflect stack state across multiple operations', () => {
    const { result } = renderHook(() => useUndoRedo());
    const cmd1 = makeCommand();
    const cmd2 = makeCommand();

    // Empty: both false
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    // After 2 executes: canUndo true, canRedo false
    act(() => result.current.execute(cmd1));
    act(() => result.current.execute(cmd2));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    // Undo one: both true
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    // Undo another: canUndo false, canRedo true
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    // Redo one: canUndo true, canRedo true
    act(() => result.current.redo());
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    // Redo another: canUndo true, canRedo false
    act(() => result.current.redo());
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });
});
