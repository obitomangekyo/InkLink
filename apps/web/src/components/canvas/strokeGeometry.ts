import type { Point, Stroke } from "./types";

const minimumSegmentMovement = 0.5;

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const distanceToSegment = (point: Point, start: Point, end: Point) => {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (lengthSquared === 0) {
    return distance(point, start);
  }

  const projection = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / lengthSquared)
  );

  return distance(point, {
    x: start.x + projection * segmentX,
    y: start.y + projection * segmentY
  });
};

export const createStrokeId = () =>
  typeof crypto === "undefined" || !("randomUUID" in crypto)
    ? `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`
    : crypto.randomUUID();

export const hasVisiblePointMovement = (stroke: Pick<Stroke, "points">) => {
  const firstPoint = stroke.points[0];

  if (!firstPoint) {
    return false;
  }

  return stroke.points.some((point) => distance(point, firstPoint) >= minimumSegmentMovement);
};

// Returns intermediate world-space points along the [start, end] segment,
// spaced no more than `step` units apart, ending at `end`. Used to keep
// sample density high so the eraser can split precisely between any two
// points.
export const densifySegment = (start: Point, end: Point, step: number): Point[] => {
  const safeStep = step > 0 ? step : 0.5;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length <= safeStep || length === 0) {
    return [end];
  }

  const count = Math.max(1, Math.floor(length / safeStep));
  const points: Point[] = [];

  for (let i = 1; i <= count; i++) {
    const t = i / count;
    points.push({ x: start.x + t * dx, y: start.y + t * dy });
  }

  return points;
};

const createSegmentStroke = (stroke: Stroke, points: Point[], index: number): Stroke | null => {
  const segment = {
    ...stroke,
    id: `${stroke.id}:segment-${index}`,
    points
  };

  return points.length > 1 && hasVisiblePointMovement(segment) ? segment : null;
};

export const eraseStrokesAtPoint = (
  strokes: Stroke[],
  eraserCenter: Point,
  getEraserRadius: (stroke: Stroke) => number
) =>
  strokes.flatMap((stroke) => {
    const eraserRadius = getEraserRadius(stroke);

    // Strokes wider than the cursor clamp to a radius of zero and are left
    // untouched. Bail out early so we don't pay for splitting geometry that
    // can't actually be carved.
    if (eraserRadius === 0) {
      return [stroke];
    }

    const survivors: Stroke[] = [];
    let segmentPoints: Point[] = [];

    stroke.points.forEach((point, index) => {
      const previousPoint = stroke.points[index - 1];
      const pointIsErased = distance(point, eraserCenter) <= eraserRadius;
      const segmentIsErased = previousPoint
        ? distanceToSegment(eraserCenter, previousPoint, point) <= eraserRadius
        : false;

      if (pointIsErased || segmentIsErased) {
        const segmentStroke = createSegmentStroke(stroke, segmentPoints, survivors.length);

        if (segmentStroke) {
          survivors.push(segmentStroke);
        }

        segmentPoints = [];
        return;
      }

      segmentPoints = [...segmentPoints, point];
    });

    const trailingSegment = createSegmentStroke(stroke, segmentPoints, survivors.length);

    if (trailingSegment) {
      survivors.push(trailingSegment);
    }

    return survivors.length === 0 &&
      stroke.points.every((point) => distance(point, eraserCenter) > eraserRadius)
      ? [stroke]
      : survivors;
  });
