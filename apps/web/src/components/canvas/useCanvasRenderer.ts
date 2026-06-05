import {
  type MutableRefObject,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  clamp,
  getPanIndicator,
  getScreenPoint,
  getViewportCenter,
  maxZoom,
  minZoom,
  screenToWorld
} from "./canvasMath";
import { drawInfiniteGrid, drawStroke } from "./canvasRenderer";
import {
  createStrokeId,
  densifySegment,
  eraseStrokesAtPoint,
  hasVisiblePointMovement
} from "./strokeGeometry";
import type {
  BoardStats,
  Camera,
  Interaction,
  PanIndicatorState,
  Point,
  Stroke,
  Tool
} from "./types";

type CanvasRefs = {
  activeColorRef: RefObject<string>;
  activeToolRef: RefObject<Tool>;
  brushSizeRef: RefObject<number>;
  isSpaceHeld: boolean;
  onStatsChange: (stats: BoardStats) => void;
};

type UseCanvasRendererResult = {
  camera: Camera;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  clearBoard: () => void;
  handleBoardPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handleBoardPointerLeave: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handleBoardPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handleBoardPointerUp: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  handleBoardPointerCancel: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  panIndicator: PanIndicatorState;
  pointer: Point | null;
  redo: () => void;
  resetZoom: () => void;
  undo: () => void;
  zoomBy: (factor: number) => void;
};

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const midpoint = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2
});

const initialCamera = (): Camera => ({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  zoom: 1
});

const demoStrokes: Stroke[] = [
  {
    color: "#e4572e",
    id: "demo-gesture-1",
    points: [
      { x: -260, y: -80 },
      { x: -120, y: -128 },
      { x: 80, y: -72 },
      { x: 220, y: -138 }
    ],
    size: 18,
    tool: "pen"
  },
  {
    color: "#2f6f9f",
    id: "demo-gesture-2",
    points: [
      { x: -180, y: 118 },
      { x: -48, y: 76 },
      { x: 124, y: 126 },
      { x: 300, y: 80 }
    ],
    size: 15,
    tool: "pen"
  }
];

const publishStats = (strokes: Stroke[], redoStack: Stroke[]): BoardStats => ({
  redoCount: redoStack.length,
  strokeCount: strokes.length
});

export const useCanvasRenderer = ({
  activeColorRef,
  activeToolRef,
  brushSizeRef,
  isSpaceHeld,
  onStatsChange
}: CanvasRefs): UseCanvasRendererResult => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>(demoStrokes);
  const redoStackRef = useRef<Stroke[]>([]);
  const canvasSizeRef = useRef({ height: 0, width: 0 });
  const cameraRef = useRef<Camera>(initialCamera());
  const interactionRef = useRef<Interaction | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const statsRef = useRef<BoardStats>(publishStats(strokesRef.current, redoStackRef.current));
  const pointerRef = useRef<Point | null>(null);
  const activePointersRef = useRef<Map<number, Point>>(new Map());

  const [camera, setCamera] = useState<Camera>(cameraRef.current);
  const [pointer, setPointerState] = useState<Point | null>(null);
  const [panIndicator, setPanIndicator] = useState<PanIndicatorState>(() =>
    getPanIndicator(cameraRef.current)
  );

  const reportStats = useCallback(
    (next: BoardStats) => {
      statsRef.current = next;
      onStatsChange(next);
    },
    [onStatsChange]
  );

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const nextWidth = Math.round(rect.width * pixelRatio);
    const nextHeight = Math.round(rect.height * pixelRatio);

    if (canvasSizeRef.current.width !== nextWidth || canvasSizeRef.current.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      canvasSizeRef.current = {
        height: nextHeight,
        width: nextWidth
      };
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    drawInfiniteGrid(context, rect, cameraRef.current);

    for (const stroke of strokesRef.current) {
      drawStroke(context, stroke, cameraRef.current);
    }

    const interaction = interactionRef.current;

    if (interaction?.mode === "draw") {
      drawStroke(context, interaction.stroke, cameraRef.current);
    }
  }, []);

  const requestRender = useCallback(() => {
    if (animationFrameRef.current) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      renderCanvas();
    });
  }, [renderCanvas]);

  const updateCamera = useCallback(
    (nextCamera: Camera) => {
      const clampedZoom = clamp(nextCamera.zoom, minZoom, maxZoom);
      cameraRef.current = { ...nextCamera, zoom: clampedZoom };
      setCamera(cameraRef.current);
      setPanIndicator(getPanIndicator(cameraRef.current));
      requestRender();
    },
    [requestRender]
  );

  const undo = useCallback(() => {
    const undoneStroke = strokesRef.current.at(-1);

    if (!undoneStroke) {
      return;
    }

    strokesRef.current = strokesRef.current.slice(0, -1);
    redoStackRef.current = [undoneStroke, ...redoStackRef.current];
    reportStats(publishStats(strokesRef.current, redoStackRef.current));
    requestRender();
  }, [reportStats, requestRender]);

  const redo = useCallback(() => {
    const [restoredStroke, ...remainingRedoStack] = redoStackRef.current;

    if (!restoredStroke) {
      return;
    }

    redoStackRef.current = remainingRedoStack;
    strokesRef.current = [...strokesRef.current, restoredStroke];
    reportStats(publishStats(strokesRef.current, redoStackRef.current));
    requestRender();
  }, [reportStats, requestRender]);

  const clearBoard = useCallback(() => {
    redoStackRef.current = [];
    strokesRef.current = [];
    reportStats(publishStats(strokesRef.current, redoStackRef.current));
    requestRender();
  }, [reportStats, requestRender]);

  const startDrawing = (screenPoint: Point) => {
    const tool = activeToolRef.current === "eraser" ? "eraser" : "pen";
    const worldPoint = screenToWorld(screenPoint, cameraRef.current);

    interactionRef.current = {
      mode: "draw",
      stroke: {
        color: activeColorRef.current ?? "#211b17",
        id: createStrokeId(),
        points: [worldPoint],
        size: brushSizeRef.current ?? 14,
        tool
      }
    };
  };

  const eraseAt = (screenPoint: Point) => {
    const worldPoint = screenToWorld(screenPoint, cameraRef.current);
    // The eraser is a world-space tool: it always carves a gap equal to the
    // cursor's on-screen diameter, regardless of how thick the stroke is.
    // A small eraser on a thick stroke leaves a small gap; a large eraser
    // wipes more. The 0.5 floor keeps the radius from collapsing to a point
    // if the brush size is ever zero.
    const brushSize = brushSizeRef.current ?? 14;
    const getEraserRadius = () => Math.max(0.5, brushSize / 2);

    const nextStrokes = eraseStrokesAtPoint(strokesRef.current, worldPoint, getEraserRadius);

    if (nextStrokes === strokesRef.current) {
      return;
    }

    strokesRef.current = nextStrokes;
    redoStackRef.current = [];
    reportStats(publishStats(strokesRef.current, redoStackRef.current));
    requestRender();
  };

  const updatePointer = useCallback((next: Point | null) => {
    pointerRef.current = next;
    setPointerState(next);
  }, []);

  const finalizeDrawStroke = (stroke: Stroke) => {
    if (!hasVisiblePointMovement(stroke)) {
      return;
    }

    strokesRef.current = [...strokesRef.current, stroke];
    redoStackRef.current = [];
    reportStats(publishStats(strokesRef.current, redoStackRef.current));
  };

  const releasePointerCapture = (
    event: React.PointerEvent<HTMLCanvasElement>,
    pointerId: number
  ) => {
    if (event.currentTarget.hasPointerCapture(pointerId)) {
      event.currentTarget.releasePointerCapture(pointerId);
    }
  };

  const handleBoardPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPoint = getScreenPoint(event);
    updatePointer(screenPoint);

    event.currentTarget.setPointerCapture(event.pointerId);
    activePointersRef.current.set(event.pointerId, screenPoint);

    // A third (or later) pointer arriving mid-gesture is ignored — the gesture
    // is locked to the first two fingers.
    if (interactionRef.current?.mode === "gesture") {
      return;
    }

    // A second pointer arriving on the canvas promotes the current interaction
    // into a pinch-zoom / two-finger pan gesture. Any partial draw stroke is
    // committed as-is first so the user doesn't lose work.
    if (activePointersRef.current.size >= 2) {
      const currentInteraction = interactionRef.current;

      if (currentInteraction?.mode === "draw") {
        finalizeDrawStroke(currentInteraction.stroke);
      }

      const firstTwo = Array.from(activePointersRef.current).slice(0, 2);
      const [firstEntry, secondEntry] = firstTwo;

      if (firstEntry && secondEntry) {
        const [firstId, firstPoint] = firstEntry;
        const [secondId, secondPoint] = secondEntry;

        interactionRef.current = {
          gesturePointerIds: [firstId, secondId],
          initialCamera: { ...cameraRef.current },
          initialDistance: distance(firstPoint, secondPoint),
          initialMidpoint: midpoint(firstPoint, secondPoint),
          mode: "gesture"
        };
        requestRender();
        return;
      }
    }

    const shouldPan =
      activeToolRef.current === "pan" ||
      isSpaceHeld ||
      event.button === 1 ||
      event.buttons === 4 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey;

    if (shouldPan) {
      interactionRef.current = {
        lastScreen: screenPoint,
        mode: "pan"
      };
      return;
    }

    if (activeToolRef.current === "eraser") {
      interactionRef.current = { mode: "erase" };
      eraseAt(screenPoint);
      return;
    }

    startDrawing(screenPoint);
    requestRender();
  };

  const handleBoardPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPoint = getScreenPoint(event);
    updatePointer(screenPoint);
    activePointersRef.current.set(event.pointerId, screenPoint);

    const interaction = interactionRef.current;

    if (!interaction) {
      return;
    }

    if (interaction.mode === "gesture") {
      const [id1, id2] = interaction.gesturePointerIds;
      const p1 = activePointersRef.current.get(id1);
      const p2 = activePointersRef.current.get(id2);

      if (!p1 || !p2) {
        return;
      }

      const currentDistance = distance(p1, p2);
      const currentMidpoint = midpoint(p1, p2);

      // Guard against a zero-length initial distance (fingers landing on the
      // exact same point); fall back to no-op instead of dividing by zero.
      if (interaction.initialDistance === 0) {
        return;
      }

      const zoomFactor = currentDistance / interaction.initialDistance;
      const targetZoom = clamp(interaction.initialCamera.zoom * zoomFactor, minZoom, maxZoom);

      // Keep the world point that was under the initial midpoint anchored
      // under the current midpoint. This produces natural two-finger pan
      // (midpoint drift) and zoom (distance change) in a single transform.
      const worldUnderInitialMidpoint = screenToWorld(
        interaction.initialMidpoint,
        interaction.initialCamera
      );

      updateCamera({
        x: currentMidpoint.x - worldUnderInitialMidpoint.x * targetZoom,
        y: currentMidpoint.y - worldUnderInitialMidpoint.y * targetZoom,
        zoom: targetZoom
      });
      return;
    }

    if (interaction.mode === "pan") {
      const delta = {
        x: screenPoint.x - interaction.lastScreen.x,
        y: screenPoint.y - interaction.lastScreen.y
      };

      interactionRef.current = {
        lastScreen: screenPoint,
        mode: "pan"
      };
      updateCamera({
        ...cameraRef.current,
        x: cameraRef.current.x + delta.x,
        y: cameraRef.current.y + delta.y
      });
      return;
    }

    if (interaction.mode === "draw") {
      const lastPoint = interaction.stroke.points[interaction.stroke.points.length - 1];
      const newWorldPoint = screenToWorld(screenPoint, cameraRef.current);

      if (!lastPoint || lastPoint.x !== newWorldPoint.x || lastPoint.y !== newWorldPoint.y) {
        const intermediates = lastPoint
          ? densifySegment(lastPoint, newWorldPoint, interaction.stroke.size / 2)
          : [newWorldPoint];

        interaction.stroke.points.push(...intermediates);
      }

      requestRender();
      return;
    }

    if (interaction.mode === "erase") {
      eraseAt(screenPoint);
    }
  };

  const handleBoardPointerLeave = (event: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointer(null);
    releaseBoardPointer(event);
  };

  const releaseBoardPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointerId = event.pointerId;
    activePointersRef.current.delete(pointerId);

    const interaction = interactionRef.current;

    if (interaction?.mode === "gesture") {
      const [id1, id2] = interaction.gesturePointerIds;
      // If either of the gesture's two pointers lifted, exit gesture mode.
      // The remaining pointer (if any) sits idle until the user lifts it too
      // — starting a new draw on finger release would feel jarring.
      if (pointerId === id1 || pointerId === id2) {
        interactionRef.current = null;
        releasePointerCapture(event, pointerId);
        requestRender();
        return;
      }
      releasePointerCapture(event, pointerId);
      return;
    }

    if (activePointersRef.current.size > 0) {
      releasePointerCapture(event, pointerId);
      return;
    }

    if (interaction?.mode === "draw") {
      finalizeDrawStroke(interaction.stroke);
    }

    interactionRef.current = null;
    releasePointerCapture(event, pointerId);
    requestRender();
  };

  const zoomBy = useCallback(
    (factor: number) => {
      const anchor = pointerRef.current ?? getViewportCenter(cameraRef.current);
      const beforeZoom = screenToWorld(anchor, cameraRef.current);
      const nextZoom = clamp(cameraRef.current.zoom * factor, minZoom, maxZoom);

      updateCamera({
        x: anchor.x - beforeZoom.x * nextZoom,
        y: anchor.y - beforeZoom.y * nextZoom,
        zoom: nextZoom
      });
    },
    [updateCamera]
  );

  const resetZoom = useCallback(() => {
    updateCamera({
      ...cameraRef.current,
      zoom: 1
    });
  }, [updateCamera]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const screenPoint = getScreenPoint(event);
      const beforeZoom = screenToWorld(screenPoint, cameraRef.current);
      const nextZoom = clamp(
        cameraRef.current.zoom * (event.deltaY > 0 ? 0.92 : 1.08),
        minZoom,
        maxZoom
      );

      updateCamera({
        x: screenPoint.x - beforeZoom.x * nextZoom,
        y: screenPoint.y - beforeZoom.y * nextZoom,
        zoom: nextZoom
      });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [updateCamera]);

  useEffect(() => {
    requestRender();

    const observer = new ResizeObserver(requestRender);
    const canvas = canvasRef.current;

    if (canvas) {
      observer.observe(canvas);
    }

    return () => observer.disconnect();
  }, [requestRender]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  return {
    camera,
    canvasRef,
    clearBoard,
    handleBoardPointerCancel: releaseBoardPointer,
    handleBoardPointerDown,
    handleBoardPointerLeave,
    handleBoardPointerMove,
    handleBoardPointerUp: releaseBoardPointer,
    panIndicator,
    pointer,
    redo,
    resetZoom,
    undo,
    zoomBy
  };
};
