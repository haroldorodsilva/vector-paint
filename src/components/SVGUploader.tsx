import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, AlertTriangle, Check } from 'lucide-react';
import type { Category } from '../lib/types';
import { validateSvgFile, sanitizeSvg } from '../lib/svgUtils';

interface SVGUploaderProps {
  categories: Category[];
  onUpload: (name: string, categoryId: string, svgContent: string) => void;
  onBack: () => void;
}

/** Inject SVG and force it to fit within the preview container */
function SvgPreview({ svgContent }: { svgContent: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = svgContent;
    const svg = el.querySelector('svg');
    if (!svg) return;

    if (!svg.getAttribute('viewBox')) {
      const w = parseFloat(svg.getAttribute('width') || '0');
      const h = parseFloat(svg.getAttribute('height') || '0');
      if (w > 0 && h > 0) {
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
    }
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    `;
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }, [svgContent]);

  return (
    <div
      ref={ref}
      className="w-full max-w-xs mx-auto border-2 border-dashed border-purple-200 rounded-xl bg-gray-50"
      style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', padding: 8 }}
    />
  );
}

export default function SVGUploader({
  categories,
  onUpload,
  onBack,
}: SVGUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(() => {
    const def = categories.find((c) => c.isDefault);
    return def ? def.id : categories[0]?.id ?? '';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSvgContent(null);
    setName('');

    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateSvgFile(file);
    if (!validation.valid) {
      setError(validation.error ?? 'Arquivo inválido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const sanitized = sanitizeSvg(raw);
      setSvgContent(sanitized);
      const baseName = file.name.replace(/\.svg$/i, '');
      setName(baseName);
    };
    reader.onerror = () => {
      setError('Não foi possível ler o arquivo. Tente novamente.');
    };
    reader.readAsText(file);
  }

  function handleConfirm() {
    if (!svgContent || !name.trim()) return;
    onUpload(name.trim(), categoryId, svgContent);
  }

  function handleReset() {
    setError(null);
    setSvgContent(null);
    setName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <Upload size={24} /> Upload de SVG
        </h1>
      </div>

      {/* File input */}
      <div className="rounded-2xl bg-white shadow-md p-4 mb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Selecione um arquivo SVG
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleFileChange}
          className="block w-full text-base text-gray-700 file:mr-3 file:rounded-full file:border-0 file:bg-purple-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-200 file:cursor-pointer file:transition-colors"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4 mb-4 text-sm font-medium" role="alert">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Preview + form */}
      {svgContent && (
        <div className="rounded-2xl bg-white shadow-md p-4 flex flex-col gap-4">
          {/* SVG preview */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Pré-visualização</p>
            <SvgPreview svgContent={svgContent} />
          </div>

          {/* Name input */}
          <label className="text-sm font-semibold text-gray-600">
            Nome do desenho
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Gato"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </label>

          {/* Category select */}
          <label className="text-sm font-semibold text-gray-600">
            Categoria
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </label>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!name.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white min-h-[44px] text-sm font-semibold transition-colors cursor-pointer"
            >
              <Check size={16} /> Confirmar
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 min-h-[44px] text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
