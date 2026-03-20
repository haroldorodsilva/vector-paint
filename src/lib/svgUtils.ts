/**
 * SVG validation and sanitization utilities.
 *
 * validateSvgFile — checks file extension and MIME type
 * sanitizeSvg    — strips dangerous elements/attributes to prevent XSS
 */

/** Validate that a File is an SVG by extension and MIME type. */
export function validateSvgFile(file: File): { valid: boolean; error?: string } {
  const name = file.name ?? '';
  const hasValidExtension = name.toLowerCase().endsWith('.svg');
  const hasValidMime = file.type === 'image/svg+xml';

  if (!hasValidExtension && !hasValidMime) {
    return { valid: false, error: 'Apenas arquivos SVG (.svg) são aceitos.' };
  }
  if (!hasValidExtension) {
    return { valid: false, error: 'Apenas arquivos SVG (.svg) são aceitos.' };
  }
  if (!hasValidMime) {
    return { valid: false, error: 'Apenas arquivos SVG (.svg) são aceitos.' };
  }

  return { valid: true };
}

/**
 * Sanitize an SVG string by removing dangerous content:
 * - <script> elements
 * - <foreignObject> elements
 * - on* event-handler attributes
 * - javascript: URIs in href / xlink:href
 */
export function sanitizeSvg(raw: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'image/svg+xml');
  const svg = doc.documentElement;

  // Remove <script> elements
  svg.querySelectorAll('script').forEach((el) => el.remove());

  // Remove <foreignObject> elements
  svg.querySelectorAll('foreignObject').forEach((el) => el.remove());

  // Walk every element (including the root) and strip dangerous attributes
  const elements = [svg, ...Array.from(svg.querySelectorAll('*'))];
  elements.forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      // Remove on* event handlers (onclick, onload, onerror, …)
      if (attr.name.toLowerCase().startsWith('on')) {
        el.removeAttribute(attr.name);
      }

      // Remove javascript: URIs from href / xlink:href
      if (
        ['href', 'xlink:href'].includes(attr.name) &&
        attr.value.trim().toLowerCase().startsWith('javascript:')
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return new XMLSerializer().serializeToString(svg);
}
