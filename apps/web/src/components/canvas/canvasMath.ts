import type { Camera, PanIndicatorState, Point } from "./types";

type ScreenEvent = {
  clientX: number;
  clientY: number;
};

export const minZoom = 0.25;
export const maxZoom = 4;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getScreenPoint = (event: ScreenEvent): Point => ({
  x: event.clientX,
  y: event.clientY
});

export const screenToWorld = (point: Point, camera: Camera): Point => ({
  x: (point.x - camera.x) / camera.zoom,
  y: (point.y - camera.y) / camera.zoom
});

export const worldToScreen = (point: Point, camera: Camera): Point => ({
  x: point.x * camera.zoom + camera.x,
  y: point.y * camera.zoom + camera.y
});

export const getViewportCenter = (camera: Camera): Point =>
  screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, camera);

export const getPanIndicator = (camera: Camera): PanIndicatorState => {
  const viewportCenter = getViewportCenter(camera);
  const threshold = 80;

  if (Math.abs(viewportCenter.x) < threshold && Math.abs(viewportCenter.y) < threshold) {
    return {
      hidden: true,
      horizontal: null,
      vertical: null
    };
  }

  return {
    hidden: false,
    horizontal:
      Math.abs(viewportCenter.x) < threshold
        ? null
        : viewportCenter.x > threshold
          ? "left"
          : "right",
    vertical:
      Math.abs(viewportCenter.y) < threshold
        ? null
        : viewportCenter.y > threshold
          ? "top"
          : "bottom"
  };
};
