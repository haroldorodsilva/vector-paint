import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ZoomPanState {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;
const WHEEL_ZOOM_FACTOR = 0.002;
/** Minimum px movement to count as drag (avoids blocking clicks) */
const DRAG_THRESHOLD = 4;

export function useZoomPan() {
  const [transform, setTransform] = useState<ZoomPanState>({ scale: 1, x: 0, y: 0 });
  const stateRef = useRef(transform);
  stateRef.current = transform;
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Expose whether user is currently dragging (so click events can be suppressed)
  const isDraggingRef = useRef(false);

  // --- Pinch (touch) ---
  const startDistRef = useRef(0);
  const startScaleRef = useRef(1);
  const startMidRef = useRef({ x: 0, y: 0 });
  const startTransRef = useRef({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);

  const getDistance = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const getMidpoint = (t1: React.Touch, t2: React.Touch) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      startDistRef.current = getDistance(t1, t2);
      startScaleRef.current = stateRef.current.scale;
      startMidRef.current = getMidpoint(t1, t2);
      startTransRef.current = { x: stateRef.current.x, y: stateRef.current.y };
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = getDistance(t1, t2);
      const mid = getMidpoint(t1, t2);

      const rawScale = startScaleRef.current * (dist / startDistRef.current);
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale));

      const x = startTransRef.current.x + (mid.x - startMidRef.current.x);
      const y = startTransRef.current.y + (mid.y - startMidRef.current.y);

      setTransform({ scale, x, y });
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    isPinchingRef.current = false;
    const s = stateRef.current;
    if (s.scale <= 1.05) {
      setTransform({ scale: 1, x: 0, y: 0 });
    }
  }, []);

  // --- Mouse wheel zoom (Ctrl+wheel) ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setTransform((prev) => {
          const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
          const rawScale = prev.scale * (1 + delta);
          const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale));
          if (scale <= 1.05) return { scale: 1, x: 0, y: 0 };
          return { ...prev, scale };
        });
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // --- Mouse left-click drag to pan (only when zoomed) ---
  const mouseDownRef = useRef(false);
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const dragStartTransRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // left button only
    if (stateRef.current.scale <= 1.05) return; // only when zoomed
    mouseDownRef.current = true;
    movedRef.current = false;
    isDraggingRef.current = false;
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    dragStartTransRef.current = { x: stateRef.current.x, y: stateRef.current.y };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseDownRef.current) return;
    const dx = e.clientX - dragStartMouseRef.current.x;
    const dy = e.clientY - dragStartMouseRef.current.y;
    // Only start drag after threshold to allow normal clicks
    if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    movedRef.current = true;
    isDraggingRef.current = true;
    e.preventDefault();
    setTransform((prev) => ({
      ...prev,
      x: dragStartTransRef.current.x + dx,
      y: dragStartTransRef.current.y + dy,
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    mouseDownRef.current = false;
    // Small delay to let click event fire first, then reset drag flag
    requestAnimationFrame(() => {
      isDraggingRef.current = false;
    });
  }, []);

  // --- Button controls ---
  const zoomIn = useCallback(() => {
    setTransform((prev) => {
      const scale = Math.min(MAX_SCALE, prev.scale + ZOOM_STEP);
      return { ...prev, scale };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => {
      const scale = Math.max(MIN_SCALE, prev.scale - ZOOM_STEP);
      if (scale <= 1.05) return { scale: 1, x: 0, y: 0 };
      return { ...prev, scale };
    });
  }, []);

  const resetZoom = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  return {
    transform,
    containerRef,
    isDragging: isDraggingRef,
    isPinching: isPinchingRef,
    zoomIn,
    zoomOut,
    resetZoom,
    canZoomIn: transform.scale < MAX_SCALE,
    canZoomOut: transform.scale > MIN_SCALE,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
    },
  };
}
