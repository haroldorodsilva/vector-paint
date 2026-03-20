import { Pipette } from 'lucide-react';

/** All colors organized by family, flat array for compact grid */
const COLORS = [
  // Vermelhos
  '#B71C1C', '#D32F2F', '#F44336', '#EF5350', '#FF8A80', '#FFCDD2',
  // Rosas
  '#880E4F', '#C2185B', '#E91E63', '#F06292', '#FF4081', '#F8BBD0',
  // Laranjas
  '#E65100', '#FF6D00', '#FF9100', '#F57C00', '#FFB74D', '#FFE0B2',
  // Amarelos
  '#F9A825', '#FFC400', '#FDD835', '#FFD740', '#FFF176', '#FFF9C4',
  // Verdes
  '#33691E', '#689F38', '#00C853', '#69F0AE', '#AED581', '#DCEDC8',
  // Azuis
  '#0D47A1', '#0288D1', '#2979FF', '#40C4FF', '#64B5F6', '#80D8FF',
  // Roxos
  '#4A148C', '#7B1FA2', '#AA00FF', '#7C4DFF', '#CE93D8', '#E1BEE7',
  // Marrons / Pele
  '#3E2723', '#5D4037', '#795548', '#BCAAA4', '#FFCCBC', '#EFEBE9',
  // Neutros
  '#212121', '#757575', '#9E9E9E', '#E0E0E0', '#F5F5F5', '#FFFFFF',
  // Neon
  '#FF1744', '#D500F9', '#76FF03', '#00E5FF', '#FFEA00', '#FF6D00',
];

interface ColorPaletteProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const isLight = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 186;
};

export default function ColorPalette({
  selectedColor,
  onSelectColor,
}: ColorPaletteProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Selected color + custom picker */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-3 border-purple-400 shadow-md shrink-0"
          style={{ backgroundColor: selectedColor }}
          aria-label={`Cor selecionada: ${selectedColor}`}
        />
        <label className="flex items-center gap-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1.5 transition-colors" title="Escolher cor personalizada">
          <Pipette size={20} className="text-purple-500" />
          <span className="text-xs font-semibold text-gray-600">Minha cor</span>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onSelectColor(e.target.value)}
            className="w-8 h-8 cursor-pointer border-0 p-0 rounded-md"
            aria-label="Escolher cor personalizada"
          />
        </label>
      </div>

      {/* Compact color grid — 6 columns matching the family grouping */}
      <div
        className="grid grid-cols-6 gap-1.5"
        role="radiogroup"
        aria-label="Paleta de cores"
      >
        {COLORS.map((color) => {
          const active = selectedColor.toUpperCase() === color.toUpperCase();
          return (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`Cor ${color}`}
              onClick={() => onSelectColor(color)}
              className={`w-full aspect-square rounded-full transition-all duration-150 cursor-pointer ${
                active
                  ? 'scale-115 ring-3 ring-purple-500 ring-offset-2 z-10 shadow-lg'
                  : 'hover:scale-110 hover:shadow-md'
              } ${isLight(color) ? 'border-2 border-gray-300' : ''}`}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
    </div>
  );
}
