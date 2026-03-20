import { PaintBucket, Paintbrush, Eraser, Undo2, Redo2, Trash2 } from 'lucide-react';
import type { PaintTool } from '../lib/types';

interface ToolbarProps {
  activeTool: PaintTool;
  onSelectTool: (tool: PaintTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearAll: () => void;
}

const TOOLS: { tool: PaintTool; icon: typeof PaintBucket; label: string }[] = [
  { tool: 'bucket', icon: PaintBucket, label: 'Balde' },
  { tool: 'brush', icon: Paintbrush, label: 'Pincel' },
  { tool: 'eraser', icon: Eraser, label: 'Borracha' },
];

export default function Toolbar({
  activeTool,
  onSelectTool,
  brushSize,
  onBrushSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearAll,
}: ToolbarProps) {
  const handleClearAll = () => {
    if (window.confirm('Tem certeza que deseja limpar tudo?')) {
      onClearAll();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Tool buttons */}
      <div
        className="flex items-center gap-1 flex-wrap"
        role="toolbar"
        aria-label="Ferramentas de pintura"
      >
        {TOOLS.map(({ tool, icon: Icon, label }) => {
          const active = activeTool === tool;
          return (
            <button
              key={tool}
              type="button"
              aria-pressed={active}
              aria-label={label}
              title={label}
              onClick={() => onSelectTool(tool)}
              className={`w-9 h-9 flex items-center justify-center rounded-full
                transition-all cursor-pointer
                ${active
                  ? 'bg-purple-500 text-white shadow-md scale-110'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
            >
              <Icon size={18} />
            </button>
          );
        })}

        <div className="w-px h-6 bg-gray-300 mx-0.5" />

        <button
          type="button"
          aria-label="Desfazer"
          title="Desfazer"
          disabled={!canUndo}
          onClick={onUndo}
          className="w-9 h-9 flex items-center justify-center rounded-full
            bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          aria-label="Refazer"
          title="Refazer"
          disabled={!canRedo}
          onClick={onRedo}
          className="w-9 h-9 flex items-center justify-center rounded-full
            bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Redo2 size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-0.5" />

        <button
          type="button"
          aria-label="Limpar Tudo"
          title="Limpar Tudo"
          onClick={handleClearAll}
          className="w-9 h-9 flex items-center justify-center rounded-full
            bg-red-50 hover:bg-red-100 text-red-500 transition-all cursor-pointer"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Brush size slider */}
      {activeTool === 'brush' && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-gray-500 shrink-0">Espessura</span>
          <input
            type="range"
            min={2}
            max={20}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="flex-1 accent-purple-500 h-1"
            aria-label="Espessura do pincel"
          />
          <span className="text-[10px] font-bold text-purple-600 w-4 text-center">
            {brushSize}
          </span>
        </div>
      )}
    </div>
  );
}
