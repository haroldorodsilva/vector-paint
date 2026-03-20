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

const TOOLS: { tool: PaintTool; icon: typeof PaintBucket; label: string; emoji: string }[] = [
  { tool: 'bucket', icon: PaintBucket, label: 'Balde', emoji: '🪣' },
  { tool: 'brush', icon: Paintbrush, label: 'Pincel', emoji: '🖌️' },
  { tool: 'eraser', icon: Eraser, label: 'Borracha', emoji: '🧹' },
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
    <div className="flex flex-col gap-3">
      {/* Tool buttons — large and spaced for kids */}
      <div
        className="flex items-center gap-3 flex-wrap"
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
              className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl gap-0.5
                transition-all cursor-pointer select-none
                ${active
                  ? 'bg-purple-500 text-white shadow-lg scale-105 ring-2 ring-purple-300 ring-offset-2'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md'
                }`}
            >
              <Icon size={24} strokeWidth={2} />
              <span className="text-[9px] font-bold leading-none">{label}</span>
            </button>
          );
        })}

        <div className="w-px h-10 bg-gray-300 mx-1" />

        <button
          type="button"
          aria-label="Desfazer"
          title="Desfazer"
          disabled={!canUndo}
          onClick={onUndo}
          className="w-12 h-12 flex flex-col items-center justify-center rounded-2xl gap-0.5
            bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md"
        >
          <Undo2 size={22} strokeWidth={2} />
          <span className="text-[9px] font-bold leading-none">Voltar</span>
        </button>
        <button
          type="button"
          aria-label="Refazer"
          title="Refazer"
          disabled={!canRedo}
          onClick={onRedo}
          className="w-12 h-12 flex flex-col items-center justify-center rounded-2xl gap-0.5
            bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer
            disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md"
        >
          <Redo2 size={22} strokeWidth={2} />
          <span className="text-[9px] font-bold leading-none">Refazer</span>
        </button>

        <div className="w-px h-10 bg-gray-300 mx-1" />

        <button
          type="button"
          aria-label="Limpar Tudo"
          title="Limpar Tudo"
          onClick={handleClearAll}
          className="w-12 h-12 flex flex-col items-center justify-center rounded-2xl gap-0.5
            bg-red-50 hover:bg-red-100 text-red-500 transition-all cursor-pointer hover:shadow-md"
        >
          <Trash2 size={22} strokeWidth={2} />
          <span className="text-[9px] font-bold leading-none">Limpar</span>
        </button>
      </div>

      {/* Brush size slider — bigger touch target */}
      {activeTool === 'brush' && (
        <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2">
          <span className="text-xs font-bold text-purple-600 shrink-0">Espessura</span>
          <input
            type="range"
            min={2}
            max={20}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="flex-1 accent-purple-500 h-2"
            aria-label="Espessura do pincel"
          />
          <div
            className="rounded-full bg-purple-500 shrink-0"
            style={{ width: brushSize + 4, height: brushSize + 4 }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
