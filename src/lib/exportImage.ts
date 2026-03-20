/**
 * Image export utilities for the Pintura app.
 * Combines SVG + canvas overlay into PNG/JPG for download.
 */

const MIN_EXPORT_SIZE = 1024;

/**
 * Normalize a drawing name for use in filenames:
 * lowercase, spaces → dashes, remove special characters.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build an export filename in the pattern: {normalized-name}-{YYYY-MM-DD}.{ext}
 */
export function buildExportFilename(name: string, format: 'png' | 'jpg'): string {
  const normalized = normalizeName(name) || 'desenho';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${normalized}-${yyyy}-${mm}-${dd}.${format}`;
}

/**
 * Export the painted drawing (SVG + optional canvas overlay) as PNG or JPG.
 *
 * 1. Creates a temporary canvas with minimum 1024×1024 resolution
 * 2. Serializes the SVG to a data URI and draws it on the canvas
 * 3. Draws the canvas overlay on top (if provided)
 * 4. Uses toBlob (with toDataURL fallback) to generate the file
 * 5. Triggers a download via a temporary link
 */
export async function exportImage(
  svgElement: SVGSVGElement,
  canvasOverlay: HTMLCanvasElement | null,
  name: string,
  format: 'png' | 'jpg',
): Promise<void> {
  // Prefer viewBox dimensions (the real drawing size) over rendered size
  const viewBox = svgElement.viewBox?.baseVal;
  let svgWidth: number;
  let svgHeight: number;

  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    svgWidth = viewBox.width;
    svgHeight = viewBox.height;
  } else {
    const svgRect = svgElement.getBoundingClientRect();
    svgWidth = svgRect.width || svgElement.clientWidth || MIN_EXPORT_SIZE;
    svgHeight = svgRect.height || svgElement.clientHeight || MIN_EXPORT_SIZE;
  }

  // Scale up to meet minimum export resolution while preserving aspect ratio
  const scale = Math.max(1, MIN_EXPORT_SIZE / Math.min(svgWidth, svgHeight));
  const exportWidth = Math.round(svgWidth * scale);
  const exportHeight = Math.round(svgHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext('2d')!;

  // Clone SVG and set explicit width/height for correct rasterization
  const cloned = svgElement.cloneNode(true) as SVGSVGElement;
  cloned.setAttribute('width', String(exportWidth));
  cloned.setAttribute('height', String(exportHeight));
  // Ensure viewBox is set so the full drawing is captured
  if (!cloned.getAttribute('viewBox') && svgWidth > 0 && svgHeight > 0) {
    cloned.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  }
  cloned.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Serialize the cloned SVG to data URI
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(cloned);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    // Draw SVG onto canvas
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
        resolve();
      };
      img.onerror = () => reject(new Error('Não foi possível exportar a imagem. Tente novamente.'));
      img.src = svgUrl;
    });

    // Draw canvas overlay on top if provided
    if (canvasOverlay) {
      ctx.drawImage(canvasOverlay, 0, 0, exportWidth, exportHeight);
    }

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const filename = buildExportFilename(name, format);

    // Try toBlob first, fallback to toDataURL
    if (canvas.toBlob) {
      await new Promise<void>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              triggerDownload(URL.createObjectURL(blob), filename, true);
            } else {
              downloadViaDataUrl(canvas, mimeType, filename);
            }
            resolve();
          },
          mimeType,
          0.92,
        );
      });
    } else {
      downloadViaDataUrl(canvas, mimeType, filename);
    }
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/** Fallback: convert canvas to data URL and trigger download */
function downloadViaDataUrl(canvas: HTMLCanvasElement, mimeType: string, filename: string): void {
  const dataUrl = canvas.toDataURL(mimeType, 0.92);
  triggerDownload(dataUrl, filename, false);
}

/** Create a temporary <a> element, click it, and clean up */
function triggerDownload(url: string, filename: string, revokeUrl: boolean): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (revokeUrl) {
    URL.revokeObjectURL(url);
  }
}
