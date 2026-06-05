import { useKeyHold } from "@tanstack/react-hotkeys";
import { useCallback, useEffect, useRef, useState } from "react";

import { BoardChip } from "./canvas/BoardChip";
import { BrushCursor } from "./canvas/BrushCursor";
import { PanIndicator } from "./canvas/PanIndicator";
import { ToolsTray } from "./canvas/ToolsTray";
import type { BoardStats, FloatingPanels, Point, Tool } from "./canvas/types";
import { useBoardTitle } from "./canvas/useBoardTitle";
import { useCanvasHotkeys } from "./canvas/useCanvasHotkeys";
import { useCanvasRenderer } from "./canvas/useCanvasRenderer";
import { clampFloatingPanelPosition, useFloatingPanels } from "./canvas/useFloatingPanels";

const palette = ["#211b17", "#e4572e", "#2f6f9f", "#7f4f24", "#f2c14e", "#3f7d58"];
const defaultColor = palette[0] ?? "#211b17";

export function CanvasWorkspace() {
  const [activeColor, setActiveColor] = useState(defaultColor);
  const [activeTool, setActiveTool] = useState<Tool>("pen");
  const [brushSize, setBrushSize] = useState(14);
  const [boardStats, setBoardStats] = useState<BoardStats>({ redoCount: 0, strokeCount: 0 });

  const activeColorRef = useRef(activeColor);
  const activeToolRef = useRef(activeTool);
  const brushSizeRef = useRef(brushSize);
  const panelDragRef = useRef<{
    origin: Point;
    panel: keyof FloatingPanels;
    start: Point;
  } | null>(null);

  const isSpaceHeld = useKeyHold("Space");

  const { boardTitle, commitBoardTitle, setBoardTitle } = useBoardTitle();
  const { panels, registerToolsPanel, setPanels } = useFloatingPanels();

  const {
    camera,
    canvasRef,
    clearBoard,
    handleBoardPointerCancel,
    handleBoardPointerDown,
    handleBoardPointerLeave,
    handleBoardPointerMove,
    handleBoardPointerUp,
    panIndicator,
    pointer,
    redo,
    resetZoom,
    undo,
    zoomBy
  } = useCanvasRenderer({
    activeColorRef,
    activeToolRef,
    brushSizeRef,
    isSpaceHeld,
    onStatsChange: setBoardStats
  });

  const onZoomIn = useCallback(() => zoomBy(1.2), [zoomBy]);
  const onZoomOut = useCallback(() => zoomBy(1 / 1.2), [zoomBy]);

  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useCanvasHotkeys({
    onClear: clearBoard,
    onRedo: redo,
    onResetZoom: resetZoom,
    onSelectTool: setActiveTool,
    onUndo: undo,
    onZoomIn,
    onZoomOut
  });

  const startPanelDrag = useCallback(
    (panel: keyof FloatingPanels, event: React.PointerEvent) => {
      const target = event.currentTarget as HTMLElement;
      target.setPointerCapture(event.pointerId);

      panelDragRef.current = {
        origin: { x: event.clientX, y: event.clientY },
        panel,
        start: panels[panel].position
      };
    },
    [panels]
  );

  const movePanelDrag = useCallback(
    (event: React.PointerEvent) => {
      const dragState = panelDragRef.current;

      if (!dragState) {
        return;
      }

      const nextPosition = clampFloatingPanelPosition({
        x: dragState.start.x + (event.clientX - dragState.origin.x),
        y: dragState.start.y + (event.clientY - dragState.origin.y)
      });

      setPanels((currentPanels) => ({
        ...currentPanels,
        [dragState.panel]: {
          ...currentPanels[dragState.panel],
          position: nextPosition
        }
      }));
    },
    [setPanels]
  );

  const finishPanelDrag = useCallback((event: React.PointerEvent) => {
    panelDragRef.current = null;
    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  }, []);

  const togglePanel = useCallback(
    (panel: keyof FloatingPanels) => {
      setPanels((currentPanels) => ({
        ...currentPanels,
        [panel]: {
          ...currentPanels[panel],
          collapsed: !currentPanels[panel].collapsed
        }
      }));
    },
    [setPanels]
  );

  return (
    <section
      aria-label="InkLink infinite board"
      className="board-shell fixed inset-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        aria-label="Infinite drawing board"
        className="infinite-canvas fixed inset-0 h-screen w-screen"
        data-tool={activeTool}
        onPointerCancel={handleBoardPointerCancel}
        onPointerDown={handleBoardPointerDown}
        onPointerLeave={handleBoardPointerLeave}
        onPointerMove={handleBoardPointerMove}
        onPointerUp={handleBoardPointerUp}
      />

      <PanIndicator indicator={panIndicator} />
      <BrushCursor
        brushSize={brushSize}
        color={activeColor}
        pointer={pointer}
        tool={activeTool}
        zoom={camera.zoom}
      />

      <BoardChip
        boardTitle={boardTitle}
        onCommitTitle={commitBoardTitle}
        onMoveEnd={finishPanelDrag}
        onMoveStart={(event) => startPanelDrag("board", event)}
        onMoveUpdate={movePanelDrag}
        onTitleChange={setBoardTitle}
        onToggle={() => togglePanel("board")}
        panel={panels.board}
        stats={boardStats}
        zoom={camera.zoom}
      />

      <ToolsTray
        activeColor={activeColor}
        activeTool={activeTool}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        onClear={clearBoard}
        onColorChange={setActiveColor}
        onMoveEnd={finishPanelDrag}
        onMoveStart={(event) => startPanelDrag("tools", event)}
        onMoveUpdate={movePanelDrag}
        onRedo={redo}
        onToolChange={setActiveTool}
        onToggle={() => togglePanel("tools")}
        onUndo={undo}
        palette={palette}
        panel={panels.tools}
        registerPanel={registerToolsPanel}
        stats={boardStats}
      />
    </section>
  );
}
