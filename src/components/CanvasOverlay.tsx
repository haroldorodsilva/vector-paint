import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { PaintCommand } from '../lib/types';

export interface CanvasOverlayProps {
  isActive: boolean;
  color: string;
  brushSize: number;
  onCommand: (cmd: PaintCommand) => void;
}

export interface CanvasOverlayHandle {
  getCanvas: () => HTMLCanvasElement | null;
  clearCanvas: () => void;
}

const CanvasOverlay = forwardRef<CanvasOverlayHandle, CanvasOverlayProps>(
  function CanvasOverlay({ isActive, color, brushSize, onCommand }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const beforeStrokeRef = useRef<ImageData | null>(null);

    const getCtx = useCallback((): CanvasRenderingContext2D | null => {
      return canvasRef.current?.getContext('2d') ?? null;
    }, []);

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, [getCtx]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      clearCanvas,
    }), [clearCanvas]);

    // Resize canvas to match parent dimensions
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (!parent) return;

      const syncSize = () => {
        const { width, height } = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const newW = Math.round(width * dpr);
        const newH = Math.round(height * dpr);

        if (canvas.width === newW && canvas.height === newH) return;

        // Save current content before resize
        const ctx = canvas.getContext('2d');
        const saved = ctx?.getImageData(0, 0, canvas.width, canvas.height);

        canvas.width = newW;
        canvas.height = newH;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        if (ctx) {
          ctx.scale(dpr, dpr);
          // Restore previous content if any
          if (saved) ctx.putImageData(saved, 0, 0);
        }
      };

      syncSize();

      const observer = new ResizeObserver(syncSize);
      observer.observe(parent);
      return () => observer.disconnect();
    }, []);

    // Drawing helpers
    const getPos = useCallback(
      (e: PointerEvent): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      },
      [],
    );

    const beginStroke = useCallback(
      (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
      },
      [brushSize, color],
    );

    // Pointer event handlers
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !isActive) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const onPointerDown = (e: PointerEvent) => {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        isDrawingRef.current = true;

        // Save canvas state before the stroke for undo
        beforeStrokeRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const { x, y } = getPos(e);
        beginStroke(ctx, x, y);
        // Draw a dot for single clicks
        ctx.lineTo(x + 0.1, y + 0.1);
        ctx.stroke();
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        isDrawingRef.current = false;

        const beforeData = beforeStrokeRef.current;
        const afterData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (beforeData) {
          const cmd: PaintCommand = {
            type: 'stroke',
            undo: () => {
              const c = canvas.getContext('2d');
              if (c) c.putImageData(beforeData, 0, 0);
            },
            redo: () => {
              const c = canvas.getContext('2d');
              if (c) c.putImageData(afterData, 0, 0);
            },
          };
          onCommand(cmd);
        }

        beforeStrokeRef.current = null;
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);

      return () => {
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
      };
    }, [isActive, getPos, beginStroke, onCommand]);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          touchAction: 'none',
          pointerEvents: isActive ? 'auto' : 'none',
        }}
        aria-label="Área de pintura livre"
      />
    );
  },
);

export default CanvasOverlay;
