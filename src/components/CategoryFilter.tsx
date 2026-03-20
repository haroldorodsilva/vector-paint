import { Palette, FolderOpen } from 'lucide-react';
import type { Category } from '../lib/types';

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
      role="tablist"
      aria-label="Filtrar por categoria"
    >
      <button
        type="button"
        role="tab"
        aria-selected={selected === null}
        onClick={() => onSelect(null)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 min-h-[44px] text-sm font-semibold transition-colors shrink-0 cursor-pointer ${
          selected === null
            ? 'bg-purple-500 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Palette size={16} />
        <span>Todas</span>
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          role="tab"
          aria-selected={selected === cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 min-h-[44px] text-sm font-semibold transition-colors shrink-0 cursor-pointer ${
            selected === cat.id
              ? 'bg-purple-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat.emoji ? (
            <span>{cat.emoji}</span>
          ) : (
            <FolderOpen size={16} />
          )}
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
