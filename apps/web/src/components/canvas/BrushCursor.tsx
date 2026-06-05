import type { Point, Tool } from "./types";

type BrushCursorProps = {
  brushSize: number;
  color: string;
  pointer: Point | null;
  tool: Tool;
  zoom: number;
};

const MIN_CURSOR_PX = 4;

export function BrushCursor({ brushSize, color, pointer, tool, zoom }: BrushCursorProps) {
  if (!pointer || tool === "pan") {
    return null;
  }

  const isEraser = tool === "eraser";
  // The cursor previews the actual on-screen size of the stroke so users
  // always see what they're about to paint.
  const previewSize = brushSize * zoom;
  const size = Math.max(MIN_CURSOR_PX, previewSize);

  return (
    <div
      aria-hidden
      className="brush-cursor"
      data-tool={tool}
      style={{
        background: isEraser ? `${color}33` : color,
        borderColor: color,
        height: size,
        left: pointer.x,
        top: pointer.y,
        width: size
      }}
    />
  );
}
