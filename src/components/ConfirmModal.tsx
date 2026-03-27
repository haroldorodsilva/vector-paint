import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Optional SVG content rendered as preview inside the modal */
  svgPreview?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Remover',
  cancelLabel = 'Cancelar',
  svgPreview,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  // Close on Escape (native dialog does this, but we sync state)
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    function handleClose() {
      onCancel();
    }
    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
  }, [onCancel]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[90vw] max-w-sm rounded-2xl bg-white shadow-2xl p-0 backdrop:bg-black/40"
    >
      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            <h2 className="text-base font-bold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* SVG preview */}
        {svgPreview && (
          <div className="mx-auto w-32 h-32 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
            <div
              className="w-28 h-28 [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: svgPreview }}
            />
          </div>
        )}

        {/* Message */}
        <p className="text-sm text-gray-600">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
