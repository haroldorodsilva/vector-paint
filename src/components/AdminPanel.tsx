import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Upload,
  FolderOpen,
  ImageOff,
  Loader2,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import {
  fetchCategories,
  insertCategory,
  updateCategoryInDb,
  deleteCategoryFromDb,
  fetchDrawings,
  insertDrawing,
  updateDrawingInDb,
  deleteDrawingFromDb,
} from '../lib/supabaseData';
import type { Category, Drawing } from '../lib/types';
import EmojiPicker from './EmojiPicker';
import ConfirmModal from './ConfirmModal';

type Tab = 'categories' | 'drawings';

interface AdminPanelProps {
  onDataChanged?: () => void;
}

export default function AdminPanel({ onDataChanged }: AdminPanelProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('categories');

  // -----------------------------------------------------------------------
  // Categories state
  // -----------------------------------------------------------------------
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState<string | null>(null);
  const [catsSuccess, setCatsSuccess] = useState<string | null>(null);

  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📁');
  const [addingCat, setAddingCat] = useState(false);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatEmoji, setEditCatEmoji] = useState('');

  // -----------------------------------------------------------------------
  // Drawings state
  // -----------------------------------------------------------------------
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [drawsLoading, setDrawsLoading] = useState(true);
  const [drawsError, setDrawsError] = useState<string | null>(null);
  const [drawsSuccess, setDrawsSuccess] = useState<string | null>(null);

  const [newDrawName, setNewDrawName] = useState('');
  const [newDrawCategoryId, setNewDrawCategoryId] = useState('');
  const [newDrawSvg, setNewDrawSvg] = useState('');
  const [addingDraw, setAddingDraw] = useState(false);

  const [editingDrawId, setEditingDrawId] = useState<string | null>(null);
  const [editDrawName, setEditDrawName] = useState('');
  const [editDrawCategoryId, setEditDrawCategoryId] = useState('');

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; svgContent?: string } | null>(null);

  // Drawings filter state
  const [drawSearchQuery, setDrawSearchQuery] = useState('');
  const [drawFilterCategoryId, setDrawFilterCategoryId] = useState<string>('');

  // -----------------------------------------------------------------------
  // Load data on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    loadCategories();
    loadDrawings();
  }, []);

  async function loadCategories() {
    setCatsLoading(true);
    setCatsError(null);
    const data = await fetchCategories();
    setCategories(data);
    setCatsLoading(false);
  }

  async function loadDrawings() {
    setDrawsLoading(true);
    setDrawsError(null);
    const data = await fetchDrawings();
    setDrawings(data);
    setDrawsLoading(false);
  }

  function showCatSuccess(msg: string) {
    setCatsSuccess(msg);
    setTimeout(() => setCatsSuccess(null), 3000);
  }

  function showDrawSuccess(msg: string) {
    setDrawsSuccess(msg);
    setTimeout(() => setDrawsSuccess(null), 3000);
  }

  // -----------------------------------------------------------------------
  // Category handlers
  // -----------------------------------------------------------------------
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    setCatsError(null);
    const created = await insertCategory(newCatName.trim(), newCatEmoji || '📁');
    if (created) {
      setCategories((prev) => [...prev, created]);
      setNewCatName('');
      setNewCatEmoji('📁');
      showCatSuccess('Categoria criada com sucesso!');
      onDataChanged?.();
    } else {
      setCatsError('Erro ao criar categoria. Verifique se o Supabase está configurado.');
    }
    setAddingCat(false);
  }

  function startEditCategory(cat: Category) {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatEmoji(cat.emoji);
  }

  async function handleSaveCategory() {
    if (!editingCatId || !editCatName.trim()) return;
    setCatsError(null);
    const ok = await updateCategoryInDb(editingCatId, editCatName.trim(), editCatEmoji || '📁');
    if (ok) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCatId ? { ...c, name: editCatName.trim(), emoji: editCatEmoji || '📁' } : c,
        ),
      );
      setEditingCatId(null);
      showCatSuccess('Categoria atualizada!');
      onDataChanged?.();
    } else {
      setCatsError('Erro ao atualizar categoria.');
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!window.confirm(`Remover a categoria "${name}"?`)) return;
    setCatsError(null);
    const ok = await deleteCategoryFromDb(id);
    if (ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showCatSuccess('Categoria removida!');
      onDataChanged?.();
    } else {
      setCatsError('Erro ao remover categoria.');
    }
  }

  // -----------------------------------------------------------------------
  // Drawing handlers
  // -----------------------------------------------------------------------
  function handleSvgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewDrawSvg((ev.target?.result as string) ?? '');
      if (!newDrawName) {
        const baseName = file.name.lastIndexOf('.') > 0
          ? file.name.substring(0, file.name.lastIndexOf('.'))
          : file.name;
        setNewDrawName(baseName);
      }
    };
    reader.readAsText(file);
  }

  async function handleAddDrawing(e: React.FormEvent) {
    e.preventDefault();
    if (!newDrawName.trim() || !newDrawSvg) return;
    setAddingDraw(true);
    setDrawsError(null);
    const catId = newDrawCategoryId || (categories[0]?.id ?? '');
    const created = await insertDrawing(newDrawName.trim(), catId, newDrawSvg);
    if (created) {
      setDrawings((prev) => [...prev, created]);
      setNewDrawName('');
      setNewDrawCategoryId('');
      setNewDrawSvg('');
      showDrawSuccess('Desenho adicionado com sucesso!');
      onDataChanged?.();
    } else {
      setDrawsError('Erro ao adicionar desenho. Verifique se o Supabase está configurado.');
    }
    setAddingDraw(false);
  }

  function startEditDrawing(drawing: Drawing) {
    setEditingDrawId(drawing.id);
    setEditDrawName(drawing.name);
    setEditDrawCategoryId(drawing.categoryId);
  }

  async function handleSaveDrawing() {
    if (!editingDrawId || !editDrawName.trim()) return;
    setDrawsError(null);
    const ok = await updateDrawingInDb(editingDrawId, editDrawName.trim(), editDrawCategoryId);
    if (ok) {
      setDrawings((prev) =>
        prev.map((d) =>
          d.id === editingDrawId ? { ...d, name: editDrawName.trim(), categoryId: editDrawCategoryId } : d,
        ),
      );
      setEditingDrawId(null);
      showDrawSuccess('Desenho atualizado!');
      onDataChanged?.();
    } else {
      setDrawsError('Erro ao atualizar desenho.');
    }
  }

  function requestDeleteDrawing(drawing: Drawing) {
    setDeleteTarget({ id: drawing.id, name: drawing.name, svgContent: drawing.svgContent });
  }

  async function confirmDeleteDrawing() {
    if (!deleteTarget) return;
    setDrawsError(null);
    const ok = await deleteDrawingFromDb(deleteTarget.id);
    if (ok) {
      setDrawings((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      showDrawSuccess('Desenho removido!');
      onDataChanged?.();
    } else {
      setDrawsError('Erro ao remover desenho.');
    }
    setDeleteTarget(null);
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      {/* Top bar */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Galeria
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-bold text-purple-700">Painel Admin</h1>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        <button
          type="button"
          onClick={() => setTab('categories')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            tab === 'categories'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderOpen size={15} />
          Categorias
        </button>
        <button
          type="button"
          onClick={() => setTab('drawings')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            tab === 'drawings'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ImageOff size={15} />
          Desenhos
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* ----------------------------------------------------------------
            CATEGORIES TAB
        ---------------------------------------------------------------- */}
        {tab === 'categories' && (
          <div className="flex flex-col gap-6">
            {/* Add category form */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Plus size={16} /> Nova Categoria
              </h2>
              <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Nome da categoria"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <EmojiPicker
                  value={newCatEmoji}
                  onChange={setNewCatEmoji}
                  className="w-24"
                />
                <button
                  type="submit"
                  disabled={addingCat}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-semibold px-4 py-2 transition-colors cursor-pointer"
                >
                  {addingCat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Criar
                </button>
              </form>
            </div>

            {/* Feedback */}
            {catsSuccess && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                {catsSuccess}
              </p>
            )}
            {catsError && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                {catsError}
              </p>
            )}

            {/* Category list */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 text-sm font-bold text-gray-600">
                Categorias ({categories.length})
              </div>
              {catsLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 size={24} className="animate-spin mr-2" /> Carregando…
                </div>
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-1">
                  <FolderOpen size={32} />
                  <p className="text-sm">Nenhuma categoria</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {categories.map((cat) =>
                    editingCatId === cat.id ? (
                      <li key={cat.id} className="flex items-center gap-3 px-5 py-3 bg-purple-50">
                        <EmojiPicker
                          value={editCatEmoji}
                          onChange={setEditCatEmoji}
                          className="w-14"
                        />
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <button type="button" onClick={handleSaveCategory} className="text-green-600 hover:text-green-800 cursor-pointer">
                          <Check size={16} />
                        </button>
                        <button type="button" onClick={() => setEditingCatId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                          <X size={16} />
                        </button>
                      </li>
                    ) : (
                      <li key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="flex-1 text-sm font-medium text-gray-800">
                          {cat.name}
                          {cat.isDefault && (
                            <span className="ml-2 text-[10px] bg-purple-100 text-purple-600 rounded-full px-2 py-0.5">padrão</span>
                          )}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startEditCategory(cat)}
                            className="text-blue-500 hover:text-blue-700 cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          {!cat.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="text-red-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------
            DRAWINGS TAB
        ---------------------------------------------------------------- */}
        {tab === 'drawings' && (
          <div className="flex flex-col gap-6">
            {/* Add drawing form */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Upload size={16} /> Novo Desenho
              </h2>
              <form onSubmit={handleAddDrawing} className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Nome do desenho"
                    value={newDrawName}
                    onChange={(e) => setNewDrawName(e.target.value)}
                    required
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <select
                    value={newDrawCategoryId}
                    onChange={(e) => setNewDrawCategoryId(e.target.value)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">Categoria…</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 px-4 py-3 text-sm text-gray-500 transition-colors flex-1">
                    <Upload size={16} />
                    {newDrawSvg ? '✅ SVG carregado' : 'Selecionar arquivo SVG'}
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      onChange={handleSvgFile}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={addingDraw || !newDrawSvg}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-semibold px-4 py-2.5 transition-colors cursor-pointer"
                  >
                    {addingDraw ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Adicionar
                  </button>
                </div>

                {/* SVG preview */}
                {newDrawSvg && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Pré-visualização</p>
                    <div className="mx-auto w-40 h-40 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                      <div
                        className="w-36 h-36 [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: newDrawSvg }}
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Feedback */}
            {drawsSuccess && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                {drawsSuccess}
              </p>
            )}
            {drawsError && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                {drawsError}
              </p>
            )}

            {/* Search & filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome…"
                  value={drawSearchQuery}
                  onChange={(e) => setDrawSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <select
                value={drawFilterCategoryId}
                onChange={(e) => setDrawFilterCategoryId(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Drawing list */}
            {(() => {
              const query = drawSearchQuery.trim().toLowerCase();
              const filteredDrawings = drawings.filter((d) => {
                const matchesName = !query || d.name.toLowerCase().includes(query);
                const matchesCat = !drawFilterCategoryId || d.categoryId === drawFilterCategoryId;
                return matchesName && matchesCat;
              });
              return (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 text-sm font-bold text-gray-600">
                Desenhos ({filteredDrawings.length}{filteredDrawings.length !== drawings.length ? ` de ${drawings.length}` : ''})
              </div>
              {drawsLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 size={24} className="animate-spin mr-2" /> Carregando…
                </div>
              ) : filteredDrawings.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-400 gap-1">
                  <ImageOff size={32} />
                  <p className="text-sm">{drawings.length === 0 ? 'Nenhum desenho' : 'Nenhum desenho encontrado'}</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredDrawings.map((drawing) => {
                    const cat = categories.find((c) => c.id === drawing.categoryId);
                    return editingDrawId === drawing.id ? (
                      <li key={drawing.id} className="flex items-center gap-3 px-5 py-3 bg-purple-50">
                        <input
                          type="text"
                          value={editDrawName}
                          onChange={(e) => setEditDrawName(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <select
                          value={editDrawCategoryId}
                          onChange={(e) => setEditDrawCategoryId(e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={handleSaveDrawing} className="text-green-600 hover:text-green-800 cursor-pointer">
                          <Check size={16} />
                        </button>
                        <button type="button" onClick={() => setEditingDrawId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                          <X size={16} />
                        </button>
                      </li>
                    ) : (
                      <li key={drawing.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={`data:image/svg+xml;utf8,${encodeURIComponent(drawing.svgContent)}`}
                            alt={drawing.name}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{drawing.name}</p>
                          <p className="text-xs text-gray-400">
                            {cat ? `${cat.emoji} ${cat.name}` : 'Sem Categoria'}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startEditDrawing(drawing)}
                            className="text-blue-500 hover:text-blue-700 cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteDrawing(drawing)}
                            className="text-red-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Remover Desenho"
        message={`Tem certeza que deseja remover "${deleteTarget?.name ?? ''}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Remover"
        svgPreview={deleteTarget?.svgContent}
        onConfirm={confirmDeleteDrawing}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
