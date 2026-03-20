import { useState } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

interface ExportButtonProps {
  onExport: (format: 'png' | 'jpg') => void;
}

export default function ExportButton({ onExport }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl
          bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold
          transition-all cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <Download size={16} />
          Salvar desenho
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => onExport('png')}
            className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white
              font-bold rounded-xl transition-all cursor-pointer text-sm
              flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
          >
            <Download size={18} />
            PNG
          </button>
          <button
            type="button"
            onClick={() => onExport('jpg')}
            className="flex-1 h-10 bg-blue-500 hover:bg-blue-600 text-white
              font-bold rounded-xl transition-all cursor-pointer text-sm
              flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
          >
            <Download size={18} />
            JPG
          </button>
        </div>
      )}
    </div>
  );
}
