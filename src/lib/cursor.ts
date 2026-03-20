/**
 * Custom paintbrush cursor that reflects the selected color.
 * Same SVG design as DigiLetras Coloring.tsx — tip is the hotspot (bottom of bristles).
 */
export function buildCursor(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <path d="M 32 2 Q 26 8 20 16" stroke="#6B3A2A" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M 31 3 Q 25 9 19 17" stroke="#C47F4A" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M 17 15 L 22 20" stroke="#AAAAAA" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M 17 15 L 22 20" stroke="#DDDDDD" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M 13 21 Q 9 23 6 28 Q 10 33 16 31 Q 21 27 19 21 Z" fill="${color}" stroke="#222222" stroke-width="1.5"/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 6 28, crosshair`;
}
