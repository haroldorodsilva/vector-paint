import { useState } from 'react';
import type { Screen, Drawing } from './lib/types';
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
import DrawingGallery from './components/DrawingGallery';
import PaintingScreen from './components/PaintingScreen';
import CategoryManager from './components/CategoryManager';
import SVGUploader from './components/SVGUploader';

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

  const categories = ensureDefaultCategory(rawCategories);
  const allDrawings = getAllDrawings(userDrawings);

  const [screen, setScreen] = useState<Screen>('gallery');
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);

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
    setScreen('gallery');
  }

  function handleUpdateDrawing(id: string, name: string, categoryId: string) {
    saveDrawings(updateDrawing(userDrawings, id, name, categoryId));
  }

  function handleDeleteDrawing(id: string) {
    saveDrawings(deleteDrawing(userDrawings, id));
  }

  // --- Navigation ---
  function handleSelectDrawing(drawing: Drawing) {
    setSelectedDrawing(drawing);
    setScreen('painting');
  }

  function handleBackToGallery() {
    setSelectedDrawing(null);
    setScreen('gallery');
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

      {screen === 'gallery' && (
        <DrawingGallery
          categories={categories}
          drawings={allDrawings}
          onSelectDrawing={handleSelectDrawing}
          onGoToCategories={() => setScreen('categories')}
          onGoToUpload={() => setScreen('upload')}
          onDeleteDrawing={handleDeleteDrawing}
          onUpdateDrawing={handleUpdateDrawing}
        />
      )}

      {screen === 'painting' && selectedDrawing && (
        <PaintingScreen
          drawing={selectedDrawing}
          onBack={handleBackToGallery}
        />
      )}

      {screen === 'categories' && (
        <CategoryManager
          categories={categories}
          onCreateCategory={handleCreateCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onBack={() => setScreen('gallery')}
        />
      )}

      {screen === 'upload' && (
        <SVGUploader
          categories={categories}
          onUpload={handleAddDrawing}
          onBack={() => setScreen('gallery')}
        />
      )}
    </>
  );
}
