/** Navigation screens */
export type Screen = 'gallery' | 'painting' | 'categories' | 'upload';

/** Available paint tools */
export type PaintTool = 'bucket' | 'brush' | 'eraser';

/** Reversible paint command for undo/redo */
export interface PaintCommand {
  type: 'fill' | 'stroke' | 'erase' | 'clear';
  undo: () => void;
  redo: () => void;
}

/** Drawing category */
export interface Category {
  id: string;
  name: string;
  emoji: string;
  isDefault: boolean;
}

/** A drawing (built-in or user-uploaded) */
export interface Drawing {
  id: string;
  name: string;
  categoryId: string;
  svgContent: string;
  isBuiltIn: boolean;
  createdAt: number;
}

/** Root app state persisted in localStorage */
export interface AppState {
  categories: Category[];
  drawings: Drawing[];
}

/** Props for the PaintingScreen component */
export interface PaintingScreenProps {
  drawing: Drawing;
  onBack: () => void;
}

/** Props for the SVGCanvas component */
export interface SVGCanvasProps {
  svgContent: string;
  activeTool: PaintTool;
  activeColor: string;
  brushSize: number;
  onCommand: (cmd: PaintCommand) => void;
  /** Ref that is true when user is dragging to pan — suppresses paint clicks */
  isDraggingRef?: React.RefObject<boolean>;
}
