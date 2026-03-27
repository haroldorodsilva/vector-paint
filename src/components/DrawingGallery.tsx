import { useState } from 'react';
import { Palette, Upload, FolderOpen, ImageOff, Settings } from 'lucide-react';
import type { Category, Drawing } from '../lib/types';
import { filterByCategory } from '../lib/drawings';
import { supabase } from '../lib/supabase';
import CategoryFilter from './CategoryFilter';
import DrawingCard from './DrawingCard';

interface DrawingGalleryProps {
  categories: Category[];
  drawings: Drawing[];
  onSelectDrawing: (drawing: Drawing) => void;
  onGoToCategories: () => void;
  onGoToUpload: () => void;
  onGoToAdmin: () => void;
}

export default function DrawingGallery({
  categories,
  drawings,
  onSelectDrawing,
  onGoToCategories,
  onGoToUpload,
  onGoToAdmin,
}: DrawingGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isSupabaseConfigured = supabase !== null;

  const filtered = filterByCategory(drawings, selectedCategory)
    .sort((a, b) => b.createdAt - a.createdAt);

  function getCategoryInfo(categoryId: string) {
    const cat = categories.find((c) => c.id === categoryId);
    return { name: cat?.name ?? 'Sem Categoria', emoji: cat?.emoji ?? '' };
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-purple-700">
          <Palette size={24} /> Galeria de Desenhos
        </h1>
        <div className="flex gap-2">
          {!isSupabaseConfigured && (
            <>
              <button
                type="button"
                onClick={onGoToUpload}
                className="flex items-center gap-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white px-3 min-h-[40px] text-sm font-semibold transition-colors cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload SVG</span>
              </button>
              <button
                type="button"
                onClick={onGoToCategories}
                className="flex items-center gap-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white px-3 min-h-[40px] text-sm font-semibold transition-colors cursor-pointer"
              >
                <FolderOpen size={14} />
                <span>Categorias</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onGoToAdmin}
            className="flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 w-10 min-h-[40px] transition-colors cursor-pointer"
            title="Painel administrativo"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-4">
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Drawing grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <ImageOff size={48} className="mb-3" />
          <p className="text-lg font-medium">Nenhum desenho encontrado</p>
          <p className="text-sm">Tente outro filtro ou faça upload de um novo SVG.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map((drawing) => {
            const { name: catName, emoji: catEmoji } = getCategoryInfo(drawing.categoryId);

            return (
              <DrawingCard
                key={drawing.id}
                drawing={drawing}
                categoryName={catName}
                categoryEmoji={catEmoji}
                onClick={() => onSelectDrawing(drawing)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
