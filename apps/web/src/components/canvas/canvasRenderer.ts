import { worldToScreen } from "./canvasMath";
import type { Camera, Stroke } from "./types";

export const drawStroke = (context: CanvasRenderingContext2D, stroke: Stroke, camera: Camera) => {
  if (stroke.points.length < 2) {
    return;
  }

  const [firstPoint, ...remainingPoints] = stroke.points;

  if (!firstPoint) {
    return;
  }

  context.save();
  context.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = stroke.color;
  // All strokes are world-coherent: their authored world size scales with the
  // camera so a stroke drawn at "10" stays roughly the same size on screen
  // regardless of zoom.
  context.lineWidth = Math.max(1.5, stroke.size * camera.zoom);
  context.beginPath();

  const firstScreenPoint = worldToScreen(firstPoint, camera);

  context.moveTo(firstScreenPoint.x, firstScreenPoint.y);

  for (const point of remainingPoints) {
    const screenPoint = worldToScreen(point, camera);

    context.lineTo(screenPoint.x, screenPoint.y);
  }

  context.stroke();
  context.restore();
};

export const drawInfiniteGrid = (
  context: CanvasRenderingContext2D,
  rect: DOMRect,
  camera: Camera
) => {
  context.fillStyle = "#f8f1df";
  context.fillRect(0, 0, rect.width, rect.height);

  const minorStep = 48 * camera.zoom;
  const majorStep = minorStep * 4;
  const minorX = ((camera.x % minorStep) + minorStep) % minorStep;
  const minorY = ((camera.y % minorStep) + minorStep) % minorStep;
  const majorX = ((camera.x % majorStep) + majorStep) % majorStep;
  const majorY = ((camera.y % majorStep) + majorStep) % majorStep;

  context.save();
  context.lineWidth = 1;
  context.strokeStyle = "rgb(33 27 23 / 0.08)";

  for (let x = minorX; x < rect.width; x += minorStep) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, rect.height);
    context.stroke();
  }

  for (let y = minorY; y < rect.height; y += minorStep) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(rect.width, y);
    context.stroke();
  }

  context.strokeStyle = "rgb(33 27 23 / 0.16)";

  for (let x = majorX; x < rect.width; x += majorStep) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, rect.height);
    context.stroke();
  }

  for (let y = majorY; y < rect.height; y += majorStep) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(rect.width, y);
    context.stroke();
  }

  context.restore();
};
