import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import type { Category, Drawing } from './lib/types';
import { useStorage } from './lib/storage';
import {
  ensureDefaultCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignDrawings,
  DEFAULT_CATEGORY,
} from './lib/categories';
import {
  getAllDrawings,
  addDrawing,
  updateDrawing,
  deleteDrawing,
} from './lib/drawings';
import { fetchCategories, fetchDrawings } from './lib/supabaseData';
import { useAuth } from './lib/useAuth';
import DrawingGallery from './components/DrawingGallery';
import PaintingScreen from './components/PaintingScreen';
import CategoryManager from './components/CategoryManager';
import SVGUploader from './components/SVGUploader';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const {
    data: rawCategories,
    save: saveCategories,
    isAvailable,
  } = useStorage('categories', [DEFAULT_CATEGORY]);

  const {
    data: userDrawings,
    save: saveDrawings,
  } = useStorage<Drawing[]>('drawings', []);

  // Supabase remote data (merged into local data for the gallery)
  const [remoteCategories, setRemoteCategories] = useState<Category[]>([]);
  const [remoteDrawings, setRemoteDrawings] = useState<Drawing[]>([]);

  useEffect(() => {
    fetchCategories().then((cats) => setRemoteCategories(cats));
    fetchDrawings().then((draws) => setRemoteDrawings(draws));
  }, []);

  const localCategories = ensureDefaultCategory(rawCategories);

  // Merge local + remote categories, avoiding duplicates by id
  const categories: Category[] = [
    ...localCategories,
    ...remoteCategories.filter(
      (rc) => !localCategories.some((lc) => lc.id === rc.id),
    ),
  ];

  const localAllDrawings = getAllDrawings(userDrawings);

  // Merge local built-in/user drawings + remote drawings, avoiding duplicates
  const allDrawings: Drawing[] = [
    ...localAllDrawings,
    ...remoteDrawings.filter(
      (rd) => !localAllDrawings.some((ld) => ld.id === rd.id),
    ),
  ];

  const navigate = useNavigate();

  // --- Category CRUD ---
  function handleCreateCategory(name: string, emoji: string) {
    saveCategories(createCategory(categories, name, emoji));
  }

  function handleUpdateCategory(id: string, name: string, emoji: string) {
    saveCategories(updateCategory(categories, id, name, emoji));
  }

  function handleDeleteCategory(id: string) {
    const defaultCat = categories.find((c) => c.isDefault);
    if (defaultCat) {
      saveDrawings(reassignDrawings(userDrawings, id, defaultCat.id));
    }
    saveCategories(deleteCategory(categories, id));
  }

  // --- Drawing CRUD ---
  function handleAddDrawing(name: string, categoryId: string, svgContent: string) {
    saveDrawings(addDrawing(userDrawings, name, categoryId, svgContent));
    navigate('/');
  }

  function handleUpdateDrawing(id: string, name: string, categoryId: string) {
    saveDrawings(updateDrawing(userDrawings, id, name, categoryId));
  }

  function handleDeleteDrawing(id: string) {
    saveDrawings(deleteDrawing(userDrawings, id));
  }

  // --- Navigation ---
  function handleSelectDrawing(drawing: Drawing) {
    navigate(`/pintar/${drawing.id}`);
  }

  return (
    <>
      {!isAvailable && (
        <div
          role="alert"
          className="bg-amber-100 border-b border-amber-300 text-amber-800 text-sm text-center px-4 py-2 font-medium"
        >
          Armazenamento indisponível — seus dados não serão salvos.
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <DrawingGallery
              categories={categories}
              drawings={allDrawings}
              onSelectDrawing={handleSelectDrawing}
              onGoToCategories={() => navigate('/categorias')}
              onGoToUpload={() => navigate('/upload')}
              onGoToAdmin={() => navigate('/admin')}
              onDeleteDrawing={handleDeleteDrawing}
              onUpdateDrawing={handleUpdateDrawing}
            />
          }
        />
        <Route
          path="/pintar/:drawingId"
          element={
            <PaintingRoute
              drawings={allDrawings}
              onBack={() => navigate('/')}
            />
          }
        />
        <Route
          path="/categorias"
          element={
            <CategoryManager
              categories={categories}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onBack={() => navigate('/')}
            />
          }
        />
        <Route
          path="/upload"
          element={
            <SVGUploader
              categories={categories}
              onUpload={handleAddDrawing}
              onBack={() => navigate('/')}
            />
          }
        />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </>
  );
}

/** Renders AdminLogin or AdminPanel based on auth state */
function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50">
        <p className="text-gray-500 text-sm">Carregando…</p>
      </div>
    );
  }

  return user ? <AdminPanel /> : <AdminLogin />;
}

/** Resolves drawingId from URL params and renders PaintingScreen */
function PaintingRoute({
  drawings,
  onBack,
}: {
  drawings: Drawing[];
  onBack: () => void;
}) {
  const { drawingId } = useParams<{ drawingId: string }>();
  const drawing = drawings.find((d) => d.id === drawingId);

  if (!drawing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50 gap-4">
        <p className="text-lg font-bold text-gray-500">Desenho não encontrado</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl cursor-pointer transition-colors"
        >
          Voltar para galeria
        </button>
      </div>
    );
  }

  return <PaintingScreen drawing={drawing} onBack={onBack} />;
}
