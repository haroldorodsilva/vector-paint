import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
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
  const {
    transform, zoomIn, zoomOut, resetZoom,
    canZoomIn, canZoomOut, handlers: zoomHandlers,
  } = useZoomPan();

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
  const zoomPercent = Math.round(transform.scale * 100);

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

  const zoomBtnClass = `w-9 h-9 flex items-center justify-center rounded-xl
    bg-white/90 hover:bg-white text-gray-700 shadow-md backdrop-blur
    transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`;

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
        {/* Mobile zoom hint */}
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

          {/* Floating zoom controls — bottom-left of canvas */}
          <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={zoomIn}
              disabled={!canZoomIn}
              aria-label="Aumentar zoom"
              title="Aumentar zoom"
              className={zoomBtnClass}
            >
              <ZoomIn size={18} />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              disabled={!canZoomOut}
              aria-label="Diminuir zoom"
              title="Diminuir zoom"
              className={zoomBtnClass}
            >
              <ZoomOut size={18} />
            </button>
            {isZoomed && (
              <button
                type="button"
                onClick={resetZoom}
                aria-label="Resetar zoom"
                title="Voltar ao normal"
                className={zoomBtnClass}
              >
                <Maximize size={16} />
              </button>
            )}
            {isZoomed && (
              <span className="text-[10px] font-bold text-gray-500 text-center bg-white/80 rounded-lg px-1 py-0.5">
                {zoomPercent}%
              </span>
            )}
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
