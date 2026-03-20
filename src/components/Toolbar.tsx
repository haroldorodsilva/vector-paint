import { PaintBucket, Paintbrush, Eraser, Undo2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { PaintTool } from '../lib/types';

interface ToolbarProps {
  activeTool: PaintTool;
  onSelectTool: (tool: PaintTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  canUndo: boolean;
  onUndo: () => void;
  onClearAll: () => void;
  compact?: boolean;
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
  onUndo,
  onClearAll,
  compact = false,
}: ToolbarProps) {
  const [showClearModal, setShowClearModal] = useState(false);

  const toolSize = compact ? 'w-10 h-10' : 'w-14 h-14';
  const actionSize = compact ? 'w-9 h-9' : 'w-12 h-12';
  const iconSize = compact ? 18 : 24;
  const actionIconSize = compact ? 16 : 22;
  const gap = compact ? 'gap-1.5' : 'gap-3';
  const labelClass = compact ? 'text-[8px]' : 'text-[9px]';

  return (
    <>
      <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-3'}`}>
        <div
          className={`flex items-center ${gap} flex-wrap`}
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
                className={`${toolSize} flex flex-col items-center justify-center rounded-2xl gap-0.5
                  transition-all cursor-pointer select-none
                  ${active
                    ? 'bg-purple-500 text-white shadow-lg scale-105 ring-2 ring-purple-300 ring-offset-2'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md'
                  }`}
              >
                <Icon size={iconSize} strokeWidth={2} />
                <span className={`${labelClass} font-bold leading-none`}>{label}</span>
              </button>
            );
          })}

          <div className={`w-px ${compact ? 'h-7' : 'h-10'} bg-gray-300 mx-0.5`} />

          <button
            type="button"
            aria-label="Desfazer"
            title="Desfazer"
            disabled={!canUndo}
            onClick={onUndo}
            className={`${actionSize} flex flex-col items-center justify-center rounded-2xl gap-0.5
              bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer
              disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md`}
          >
            <Undo2 size={actionIconSize} strokeWidth={2} />
            {!compact && <span className="text-[9px] font-bold leading-none">Voltar</span>}
          </button>

          <div className={`w-px ${compact ? 'h-7' : 'h-10'} bg-gray-300 mx-0.5`} />

          <button
            type="button"
            aria-label="Limpar Tudo"
            title="Limpar Tudo"
            onClick={() => setShowClearModal(true)}
            className={`${actionSize} flex flex-col items-center justify-center rounded-2xl gap-0.5
              bg-red-50 hover:bg-red-100 text-red-500 transition-all cursor-pointer hover:shadow-md`}
          >
            <Trash2 size={actionIconSize} strokeWidth={2} />
            {!compact && <span className="text-[9px] font-bold leading-none">Limpar</span>}
          </button>
        </div>

        {activeTool === 'brush' && (
          <div className={`flex items-center gap-2 bg-purple-50 rounded-xl px-2 ${compact ? 'py-1' : 'py-2'}`}>
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-purple-600 shrink-0`}>Espessura</span>
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

      {/* Clear confirmation modal — portal to body so it covers the full screen */}
      {showClearModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 mx-4 max-w-sm w-full text-center">
            <div className="text-5xl mb-3">🗑️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Limpar tudo?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Seu desenho vai ser apagado. Tem certeza?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700
                  font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { onClearAll(); setShowClearModal(false); }}
                className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white
                  font-bold rounded-xl transition-all cursor-pointer text-sm shadow-md"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
