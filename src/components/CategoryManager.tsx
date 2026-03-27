import { useState } from 'react';
import { ArrowLeft, FolderOpen, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import type { Category } from '../lib/types';
import EmojiPicker from './EmojiPicker';

interface CategoryManagerProps {
  categories: Category[];
  onCreateCategory: (name: string, emoji: string) => void;
  onUpdateCategory: (id: string, name: string, emoji: string) => void;
  onDeleteCategory: (id: string) => void;
  onBack: () => void;
}

export default function CategoryManager({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onBack,
}: CategoryManagerProps) {
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateCategory(trimmed, newEmoji || '');
    setNewName('');
    setNewEmoji('');
  }

  function handleStartEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditEmoji(cat.emoji);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditEmoji('');
  }

  function handleSaveEdit() {
    if (editingId && editName.trim()) {
      onUpdateCategory(editingId, editName.trim(), editEmoji);
      handleCancelEdit();
    }
  }

  function handleDelete(cat: Category) {
    if (window.confirm(`Tem certeza que deseja remover a categoria "${cat.name}"? Os desenhos serão movidos para "Sem Categoria".`)) {
      onDeleteCategory(cat.id);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-white hover:bg-gray-100 shadow p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} className="text-purple-700" />
        </button>
        <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-purple-700">
          <FolderOpen size={24} /> Categorias
        </h1>
      </div>

      {/* Create form */}
      <div className="rounded-2xl bg-white shadow-md p-4 mb-6 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <label className="flex-1 text-sm font-semibold text-gray-600">
          Nome
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nova categoria..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </label>
        <div className="w-20 text-sm font-semibold text-gray-600">
          Emoji
          <EmojiPicker
            value={newEmoji}
            onChange={setNewEmoji}
            className="mt-1"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center justify-center gap-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white px-5 min-h-[44px] text-sm font-semibold transition-colors cursor-pointer"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Category list */}
      <div className="flex flex-col gap-3">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id;

          if (isEditing) {
            return (
              <div
                key={cat.id}
                className="rounded-2xl bg-white shadow-md border-2 border-purple-300 p-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end"
              >
                <label className="flex-1 text-sm font-semibold text-gray-600">
                  Nome
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </label>
                <div className="w-20 text-sm font-semibold text-gray-600">
                  Emoji
                  <EmojiPicker
                    value={editEmoji}
                    onChange={setEditEmoji}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white px-4 min-h-[44px] text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Save size={14} /> Salvar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 min-h-[44px] text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <X size={14} /> Cancelar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={cat.id}
              className="rounded-2xl bg-white shadow-md p-4 flex items-center gap-3"
            >
              <span className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg shrink-0">
                {cat.emoji || <FolderOpen size={20} className="text-purple-500" />}
              </span>
              <span className="flex-1 text-base font-semibold text-gray-800">
                {cat.name}
              </span>
              {cat.isDefault && (
                <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-0.5 font-medium">
                  padrão
                </span>
              )}
              <button
                type="button"
                onClick={() => handleStartEdit(cat)}
                className="rounded-full bg-blue-100 hover:bg-blue-200 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
                aria-label={`Editar ${cat.name}`}
              >
                <Pencil size={16} className="text-blue-600" />
              </button>
              {!cat.isDefault && (
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="rounded-full bg-red-100 hover:bg-red-200 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label={`Remover ${cat.name}`}
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
