import { Download } from 'lucide-react';

interface ExportButtonProps {
  onExport: (format: 'png' | 'jpg') => void;
}

export default function ExportButton({ onExport }: ExportButtonProps) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => onExport('png')}
        className="flex-1 h-8 bg-green-500 hover:bg-green-600 text-white
          font-semibold rounded-lg transition-all cursor-pointer text-xs flex items-center justify-center gap-1"
      >
        <Download size={14} />
        PNG
      </button>
      <button
        type="button"
        onClick={() => onExport('jpg')}
        className="flex-1 h-8 bg-blue-500 hover:bg-blue-600 text-white
          font-semibold rounded-lg transition-all cursor-pointer text-xs flex items-center justify-center gap-1"
      >
        <Download size={14} />
        JPG
      </button>
    </div>
  );
}
