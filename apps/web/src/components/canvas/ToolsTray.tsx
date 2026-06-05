import { Icon } from "@iconify/react";

import type { BoardStats, FloatingPanelState, Tool } from "./types";

type ToolsTrayProps = {
  activeColor: string;
  activeTool: Tool;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
  onColorChange: (color: string) => void;
  onMoveEnd: (event: React.PointerEvent) => void;
  onMoveStart: (event: React.PointerEvent) => void;
  onMoveUpdate: (event: React.PointerEvent) => void;
  onRedo: () => void;
  onToolChange: (tool: Tool) => void;
  onToggle: () => void;
  onUndo: () => void;
  palette: string[];
  panel: FloatingPanelState;
  registerPanel: (element: HTMLElement | null) => void;
  stats: BoardStats;
};

const toolOptions: Array<{ icon: string; label: string; value: Tool }> = [
  { icon: "hugeicons:pen-01", label: "Pen", value: "pen" },
  { icon: "hugeicons:eraser", label: "Eraser", value: "eraser" },
  { icon: "hugeicons:hand-grab", label: "Pan", value: "pan" }
];

export function ToolsTray({
  activeColor,
  activeTool,
  brushSize,
  onBrushSizeChange,
  onClear,
  onColorChange,
  onMoveEnd,
  onMoveStart,
  onMoveUpdate,
  onRedo,
  onToolChange,
  onToggle,
  onUndo,
  palette,
  panel,
  registerPanel,
  stats
}: ToolsTrayProps) {
  return (
    <aside
      aria-label="Canvas tools"
      className="floating-panel tool-tray ink-panel"
      data-collapsed={panel.collapsed}
      ref={registerPanel}
      style={{ left: panel.position.x, top: panel.position.y }}
    >
      <div className="panel-bar">
        <button
          aria-label="Move canvas tools"
          className="panel-grip ink-icon-button"
          onPointerDown={onMoveStart}
          onPointerMove={onMoveUpdate}
          onPointerUp={onMoveEnd}
          type="button"
        >
          <Icon aria-hidden icon="hugeicons:drag-01" />
        </button>
        <strong>Tools</strong>
        <button
          aria-label={panel.collapsed ? "Expand canvas tools" : "Collapse canvas tools"}
          className="panel-toggle ink-icon-button"
          onClick={onToggle}
          type="button"
        >
          <Icon
            aria-hidden
            icon={panel.collapsed ? "hugeicons:plus-sign" : "hugeicons:minus-sign"}
          />
        </button>
      </div>

      <div className="panel-content">
        <fieldset className="segmented-control">
          <legend className="sr-only">Drawing mode</legend>
          {toolOptions.map((tool) => (
            <button
              aria-pressed={activeTool === tool.value}
              className="ink-tool-button"
              key={tool.value}
              onClick={() => onToolChange(tool.value)}
              type="button"
            >
              <Icon aria-hidden icon={tool.icon} />
              <span>{tool.label}</span>
            </button>
          ))}
        </fieldset>

        <label className="control-row">
          <span>Size</span>
          <input
            max="48"
            min="2"
            onChange={(event) => onBrushSizeChange(Number(event.target.value))}
            type="range"
            value={brushSize}
          />
          <output>{brushSize}px</output>
        </label>

        <fieldset className="swatch-row">
          <legend className="sr-only">Brush colors</legend>
          {palette.map((color) => (
            <button
              aria-label={`Use ${color} brush`}
              className="color-swatch"
              data-active={activeColor === color}
              key={color}
              onClick={() => onColorChange(color)}
              style={{ background: color }}
              type="button"
            />
          ))}
          <input
            aria-label="Custom brush color"
            className="color-picker"
            onChange={(event) => onColorChange(event.target.value)}
            type="color"
            value={activeColor}
          />
        </fieldset>

        <div className="action-row">
          <button
            className="ink-tool-button"
            disabled={stats.strokeCount === 0}
            onClick={onUndo}
            type="button"
          >
            <Icon aria-hidden icon="hugeicons:undo-02" />
            <span>Undo</span>
          </button>
          <button
            className="ink-tool-button"
            disabled={stats.redoCount === 0}
            onClick={onRedo}
            type="button"
          >
            <Icon aria-hidden icon="hugeicons:redo-02" />
            <span>Redo</span>
          </button>
          <button
            className="ink-tool-button"
            disabled={stats.strokeCount === 0}
            onClick={onClear}
            type="button"
          >
            <Icon aria-hidden icon="hugeicons:delete-02" />
            <span>Clear</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
