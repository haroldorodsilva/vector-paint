import { useState } from 'react';
import { Palette, Upload, FolderOpen, ImageOff } from 'lucide-react';
import type { Category, Drawing } from '../lib/types';
import { filterByCategory } from '../lib/drawings';
import CategoryFilter from './CategoryFilter';
import DrawingCard from './DrawingCard';

interface DrawingGalleryProps {
  categories: Category[];
  drawings: Drawing[];
  onSelectDrawing: (drawing: Drawing) => void;
  onGoToCategories: () => void;
  onGoToUpload: () => void;
  onDeleteDrawing: (id: string) => void;
  onUpdateDrawing: (id: string, name: string, categoryId: string) => void;
}

export default function DrawingGallery({
  categories,
  drawings,
  onSelectDrawing,
  onGoToCategories,
  onGoToUpload,
  onDeleteDrawing,
  onUpdateDrawing,
}: DrawingGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  const filtered = filterByCategory(drawings, selectedCategory);

  function getCategoryInfo(categoryId: string) {
    const cat = categories.find((c) => c.id === categoryId);
    return { name: cat?.name ?? 'Sem Categoria', emoji: cat?.emoji ?? '' };
  }

  function handleStartEdit(drawing: Drawing) {
    setEditingId(drawing.id);
    setEditName(drawing.name);
    setEditCategoryId(drawing.categoryId);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditCategoryId('');
  }

  function handleSaveEdit() {
    if (editingId && editName.trim()) {
      onUpdateDrawing(editingId, editName.trim(), editCategoryId);
      handleCancelEdit();
    }
  }

  function handleDelete(drawing: Drawing) {
    if (window.confirm(`Tem certeza que deseja remover "${drawing.name}"?`)) {
      onDeleteDrawing(drawing.id);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-purple-700">
          <Palette size={24} /> Galeria de Desenhos
        </h1>
        <div className="flex gap-2">
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
            const isEditing = editingId === drawing.id;

            return isEditing ? (
              <div key={drawing.id} className="flex flex-col rounded-xl bg-white shadow-md border-2 border-purple-300 p-2 gap-1.5">
                <label className="text-[10px] font-semibold text-gray-500">
                  Nome
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <label className="text-[10px] font-semibold text-gray-500">
                  Categoria
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-1.5 mt-0.5">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 transition-colors cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold py-1 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <DrawingCard
                key={drawing.id}
                drawing={drawing}
                categoryName={catName}
                categoryEmoji={catEmoji}
                onClick={() => onSelectDrawing(drawing)}
                onEdit={!drawing.isBuiltIn ? () => handleStartEdit(drawing) : undefined}
                onDelete={!drawing.isBuiltIn ? () => handleDelete(drawing) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
