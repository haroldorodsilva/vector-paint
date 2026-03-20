import { useRef, useEffect } from 'react';
import { Star, Pencil, Trash2 } from 'lucide-react';
import type { Drawing } from '../lib/types';

interface DrawingCardProps {
  drawing: Drawing;
  categoryName: string;
  categoryEmoji: string;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Inject SVG and absolutely position it inside a fixed-size box
 * so it can never overflow.
 */
function useSvgFit(ref: React.RefObject<HTMLDivElement | null>, svgContent: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = svgContent;
    const svg = el.querySelector('svg');
    if (!svg) return;

    // Ensure viewBox exists
    if (!svg.getAttribute('viewBox')) {
      const w = parseFloat(svg.getAttribute('width') || '0');
      const h = parseFloat(svg.getAttribute('height') || '0');
      if (w > 0 && h > 0) {
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
    }
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    // Absolute position inside the relative container — can never escape
    svg.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    `;
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }, [svgContent]);
}

export default function DrawingCard({
  drawing,
  categoryName,
  categoryEmoji,
  onClick,
  onEdit,
  onDelete,
}: DrawingCardProps) {
  const svgRef = useRef<HTMLDivElement>(null);
  useSvgFit(svgRef, drawing.svgContent);

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center rounded-xl bg-white shadow-md hover:shadow-lg
          hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden
          border-2 border-transparent hover:border-purple-300
          focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
        aria-label={`Pintar ${drawing.name}`}
      >
        {/* SVG thumbnail — relative box with absolute SVG inside */}
        <div
          ref={svgRef}
          className="w-full bg-gray-50"
          style={{ position: 'relative', height: 110, overflow: 'hidden', padding: 6 }}
        />

        {/* Info area */}
        <div className="w-full px-2 py-1.5 flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold text-gray-700 truncate max-w-full">
            {drawing.name}
          </span>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5">
              <span>{categoryEmoji}</span>
              <span>{categoryName}</span>
            </span>
            {drawing.isBuiltIn && (
              <span
                className="inline-flex items-center bg-amber-100 text-amber-600 rounded-full px-1 py-0.5"
                title="Desenho pré-carregado"
              >
                <Star size={10} fill="currentColor" />
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Edit/Delete overlay */}
      {!drawing.isBuiltIn && (onEdit || onDelete) && (
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full bg-white/90 hover:bg-white shadow p-1 cursor-pointer"
              aria-label={`Editar ${drawing.name}`}
              title="Editar"
            >
              <Pencil size={12} className="text-gray-600" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full bg-white/90 hover:bg-white shadow p-1 cursor-pointer"
              aria-label={`Remover ${drawing.name}`}
              title="Remover"
            >
              <Trash2 size={12} className="text-red-500" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
