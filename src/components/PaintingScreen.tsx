import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, ZoomIn, RotateCcw } from 'lucide-react';
import type { PaintingScreenProps, PaintTool } from '../lib/types';
import { useUndoRedo } from '../lib/useUndoRedo';
import { useZoomPan } from '../lib/useZoomPan';
import { clearAll } from '../lib/paintEngine';
import { buildCursor } from '../lib/cursor';
import { exportImage } from '../lib/exportImage';
import SVGCanvas, { type SVGCanvasHandle } from './SVGCanvas';
import CanvasOverlay, { type CanvasOverlayHandle } from './CanvasOverlay';
import Toolbar from './Toolbar';
import ColorPalette from './ColorPalette';
import ExportButton from './ExportButton';

export default function PaintingScreen({ drawing, onBack }: PaintingScreenProps) {
  const [activeTool, setActiveTool] = useState<PaintTool>('bucket');
  const [activeColor, setActiveColor] = useState('#F44336');
  const [brushSize, setBrushSize] = useState(5);

  const { execute, undo, canUndo } = useUndoRedo();
  const { transform, resetZoom, handlers: zoomHandlers } = useZoomPan();

  const svgCanvasRef = useRef<SVGCanvasHandle>(null);
  const canvasOverlayRef = useRef<CanvasOverlayHandle>(null);

  const handleClearAll = useCallback(() => {
    const svgHandle = svgCanvasRef.current;
    if (!svgHandle) return;
    const elements = svgHandle.getElements();
    const originalColors = svgHandle.getOriginalColors();
    const cmd = clearAll(elements, originalColors);
    execute(cmd);
    canvasOverlayRef.current?.clearCanvas();
  }, [execute]);

  const handleExport = useCallback(async (format: 'png' | 'jpg') => {
    const svgEl = svgCanvasRef.current?.getSvgElement();
    if (!svgEl) return;
    const canvasEl = canvasOverlayRef.current?.getCanvas() ?? null;
    await exportImage(svgEl, canvasEl, drawing.name, format);
  }, [drawing.name]);

  const cursorStyle = buildCursor(activeColor);
  const isZoomed = transform.scale > 1.05;

  const toolbarProps = {
    activeTool,
    onSelectTool: setActiveTool,
    brushSize,
    onBrushSizeChange: setBrushSize,
    canUndo,
    onUndo: undo,
    onClearAll: handleClearAll,
  };

  const controls = (compact: boolean) => (
    <>
      <Toolbar {...toolbarProps} compact={compact} />
      <div className="w-full h-px bg-gray-200" />
      <ColorPalette
        selectedColor={activeColor}
        onSelectColor={setActiveColor}
        compact={compact}
      />
      <div className="w-full h-px bg-gray-200" />
      <ExportButton onExport={handleExport} />
    </>
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-purple-50 to-blue-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur shadow-sm shrink-0 z-20">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para galeria"
          className="w-10 h-10 flex items-center justify-center rounded-2xl
            bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold text-purple-700 truncate flex-1">
          {drawing.name}
        </h1>
        {/* Zoom indicator — only on touch devices when zoomed */}
        {isZoomed && (
          <button
            type="button"
            onClick={resetZoom}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 text-purple-700
              text-xs font-bold cursor-pointer hover:bg-purple-200 transition-colors"
            aria-label="Resetar zoom"
          >
            <RotateCcw size={14} />
            {Math.round(transform.scale * 100)}%
          </button>
        )}
        {!isZoomed && (
          <div className="lg:hidden flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <ZoomIn size={12} />
            2 dedos p/ zoom
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col landscape:flex-row lg:flex-row min-h-0">
        {/* Canvas area with pinch-to-zoom */}
        <div
          className="flex-1 relative min-h-0 overflow-hidden"
          style={{ cursor: cursorStyle }}
          {...zoomHandlers}
        >
          <div
            className="w-full h-full"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: 'center center',
              willChange: transform.scale !== 1 ? 'transform' : 'auto',
            }}
          >
            <SVGCanvas
              ref={svgCanvasRef}
              svgContent={drawing.svgContent}
              activeTool={activeTool}
              activeColor={activeColor}
              brushSize={brushSize}
              onCommand={execute}
            />
            <CanvasOverlay
              ref={canvasOverlayRef}
              isActive={activeTool === 'brush'}
              color={activeColor}
              brushSize={brushSize}
              onCommand={execute}
            />
          </div>
        </div>

        {/* Desktop sidebar (lg+) */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0 p-4 bg-white/90 backdrop-blur
          shadow-[-2px_0_8px_rgba(0,0,0,0.06)] overflow-y-auto scrollbar-none z-10">
          {controls(false)}
        </aside>

        {/* Landscape sidebar (mobile/tablet rotated) */}
        <aside className="hidden landscape:flex lg:!hidden flex-col gap-2 w-56 shrink-0 p-2 bg-white/95 backdrop-blur
          shadow-[-2px_0_8px_rgba(0,0,0,0.06)] overflow-y-auto scrollbar-none z-10">
          {controls(true)}
        </aside>

        {/* Portrait bottom bar (mobile vertical) */}
        <div className="flex landscape:hidden lg:!hidden shrink-0 bg-white/95 backdrop-blur
          shadow-[0_-2px_8px_rgba(0,0,0,0.08)]
          px-3 py-2 flex-col gap-1.5 z-10 max-h-[45vh] overflow-y-auto scrollbar-none">
          {controls(true)}
        </div>
      </div>
    </div>
  );
}
