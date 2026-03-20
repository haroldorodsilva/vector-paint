import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { SVGCanvasProps } from '../lib/types';
import { applyBucket, applyEraser } from '../lib/paintEngine';

/** Selectors for paintable SVG elements */
const PAINTABLE_SELECTOR = 'path, circle, ellipse, rect, polygon, polyline';

/** Handle exposed to parent via ref */
export interface SVGCanvasHandle {
  getOriginalColors: () => Map<SVGElement, string>;
  getElements: () => SVGElement[];
  getSvgElement: () => SVGSVGElement | null;
}

const SVGCanvas = forwardRef<SVGCanvasHandle, SVGCanvasProps>(
  function SVGCanvas({ svgContent, activeTool, activeColor, onCommand }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const originalColorsRef = useRef<Map<SVGElement, string>>(new Map());

    /** Gather paintable elements from the injected SVG */
    const getPaintableElements = useCallback((): SVGElement[] => {
      const container = containerRef.current;
      if (!container) return [];
      const svg = container.querySelector('svg');
      if (!svg) return [];
      return Array.from(svg.querySelectorAll(PAINTABLE_SELECTOR)) as SVGElement[];
    }, []);

    /** Get the root <svg> element */
    const getSvgElement = useCallback((): SVGSVGElement | null => {
      return containerRef.current?.querySelector('svg') ?? null;
    }, []);

    // Expose handle to parent
    useImperativeHandle(ref, () => ({
      getOriginalColors: () => originalColorsRef.current,
      getElements: getPaintableElements,
      getSvgElement,
    }), [getPaintableElements, getSvgElement]);

    // Inject SVG and set up click handlers whenever svgContent changes
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Inject sanitized SVG
      container.innerHTML = svgContent;

      // Make the SVG fill its container while preserving aspect ratio
      const svg = container.querySelector('svg');
      if (svg) {
        // Ensure viewBox is set before removing fixed dimensions
        if (!svg.getAttribute('viewBox')) {
          const w = svg.getAttribute('width');
          const h = svg.getAttribute('height');
          if (w && h) svg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
        }
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        // Remove fixed dimensions so it scales to container
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.style.display = 'block';
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = '100%';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.margin = '0 auto';
      }

      // Store original fill colors
      const colors = new Map<SVGElement, string>();
      const elements = Array.from(
        container.querySelectorAll(PAINTABLE_SELECTOR),
      ) as SVGElement[];

      for (const el of elements) {
        colors.set(el, el.getAttribute('fill') ?? '');
        // Ensure clicks register on all paintable elements
        (el as unknown as HTMLElement).style.pointerEvents = 'all';
      }

      originalColorsRef.current = colors;
    }, [svgContent]);

    // Attach / detach click handlers (depend on activeTool & activeColor)
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleClick = (e: Event) => {
        const target = (e.target as Element).closest(PAINTABLE_SELECTOR) as SVGElement | null;
        if (!target) return;

        if (activeTool === 'bucket') {
          const cmd = applyBucket(target, activeColor);
          onCommand(cmd);
          cmd.redo();
        } else if (activeTool === 'eraser') {
          const originalColor = originalColorsRef.current.get(target) ?? '';
          const cmd = applyEraser(target, originalColor);
          onCommand(cmd);
          cmd.redo();
        }
      };

      container.addEventListener('click', handleClick);
      return () => container.removeEventListener('click', handleClick);
    }, [activeTool, activeColor, onCommand]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        aria-label="Área de pintura SVG"
      />
    );
  },
);

export default SVGCanvas;
