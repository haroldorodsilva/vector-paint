import { useState } from 'react';
import { ChevronDown, ChevronUp, Pipette } from 'lucide-react';

/** Paleta expandida com 48 cores organizadas por família */
const PALETTE_COMPACT = [
  // Vermelhos / Rosas
  '#F44336', '#E91E63', '#FF4081', '#FF8A80',
  // Laranjas / Amarelos
  '#FF6D00', '#FF9100', '#FFC400', '#FFD740',
  // Verdes
  '#00C853', '#69F0AE', '#00BFA5', '#1DE9B6',
  // Azuis
  '#2979FF', '#40C4FF', '#0288D1', '#80D8FF',
  // Roxos
  '#AA00FF', '#EA80FC', '#7C4DFF', '#B388FF',
  // Marrons / Pele / Neutros
  '#795548', '#BCAAA4', '#FFCCBC', '#FFF9C4',
  // Preto / Cinza / Branco
  '#FFFFFF', '#E0E0E0', '#757575', '#212121',
];

const PALETTE_EXTENDED = [
  // Vermelhos profundos
  '#B71C1C', '#D32F2F', '#EF5350', '#FFCDD2',
  // Rosas quentes
  '#880E4F', '#C2185B', '#F06292', '#F8BBD0',
  // Laranjas
  '#E65100', '#F57C00', '#FFB74D', '#FFE0B2',
  // Amarelos
  '#F9A825', '#FDD835', '#FFF176', '#FFFDE7',
  // Verdes claros
  '#33691E', '#689F38', '#AED581', '#DCEDC8',
  // Verdes azulados
  '#004D40', '#00897B', '#4DB6AC', '#B2DFDB',
  // Azuis
  '#0D47A1', '#1976D2', '#64B5F6', '#BBDEFB',
  // Índigo / Roxos
  '#4A148C', '#7B1FA2', '#CE93D8', '#E1BEE7',
  // Cinzas
  '#263238', '#455A64', '#90A4AE', '#CFD8DC',
  // Pele / Terra
  '#3E2723', '#5D4037', '#D7CCC8', '#EFEBE9',
  // Neon / Especiais
  '#76FF03', '#00E5FF', '#FF1744', '#D500F9',
];

interface ColorPaletteProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export default function ColorPalette({
  selectedColor,
  onSelectColor,
}: ColorPaletteProps) {
  const [expanded, setExpanded] = useState(false);

  const isLight = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 186;
  };

  const colors = expanded
    ? [...PALETTE_COMPACT, ...PALETTE_EXTENDED]
    : PALETTE_COMPACT;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Selected color + custom picker */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full border-2 border-purple-400 shadow-inner shrink-0"
          style={{ backgroundColor: selectedColor }}
          aria-label={`Cor selecionada: ${selectedColor}`}
        />
        <label className="flex items-center gap-1 cursor-pointer" title="Escolher cor personalizada">
          <Pipette size={16} className="text-gray-500" />
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onSelectColor(e.target.value)}
            className="w-7 h-7 cursor-pointer border-0 p-0 rounded-md"
            aria-label="Escolher cor personalizada"
          />
        </label>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 cursor-pointer transition-colors"
          aria-label={expanded ? 'Menos cores' : 'Mais cores'}
        >
          {expanded ? (
            <>Menos <ChevronUp size={14} /></>
          ) : (
            <>Mais <ChevronDown size={14} /></>
          )}
        </button>
      </div>

      {/* Color grid */}
      <div
        className={`grid gap-1 ${expanded ? 'grid-cols-8' : 'grid-cols-7'}`}
        role="radiogroup"
        aria-label="Paleta de cores"
      >
        {colors.map((color) => {
          const active = selectedColor.toUpperCase() === color.toUpperCase();
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`Cor ${color}`}
              onClick={() => onSelectColor(color)}
              className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                active
                  ? 'scale-125 ring-2 ring-purple-500 ring-offset-1 z-10'
                  : 'hover:scale-110'
              } ${isLight(color) ? 'border border-gray-300' : ''}`}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
    </div>
  );
}
