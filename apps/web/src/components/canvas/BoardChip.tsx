import { Icon } from "@iconify/react";

import type { BoardStats, FloatingPanelState } from "./types";

type BoardChipProps = {
  boardTitle: string;
  onCommitTitle: () => void;
  onMoveEnd: (event: React.PointerEvent) => void;
  onMoveStart: (event: React.PointerEvent) => void;
  onMoveUpdate: (event: React.PointerEvent) => void;
  onTitleChange: (title: string) => void;
  onToggle: () => void;
  panel: FloatingPanelState;
  stats: BoardStats;
  zoom: number;
};

export function BoardChip({
  boardTitle,
  onCommitTitle,
  onMoveEnd,
  onMoveStart,
  onMoveUpdate,
  onTitleChange,
  onToggle,
  panel,
  stats,
  zoom
}: BoardChipProps) {
  return (
    <aside
      aria-label="Board status"
      className="floating-panel board-chip ink-panel"
      data-collapsed={panel.collapsed}
      style={{ left: panel.position.x, top: panel.position.y }}
    >
      <button
        aria-label="Move board status"
        className="panel-grip ink-icon-button"
        onPointerDown={onMoveStart}
        onPointerMove={onMoveUpdate}
        onPointerUp={onMoveEnd}
        type="button"
      >
        <Icon aria-hidden icon="hugeicons:drag-01" />
      </button>
      <button
        aria-label={panel.collapsed ? "Expand board status" : "Collapse board status"}
        className="panel-toggle ink-icon-button"
        onClick={onToggle}
        type="button"
      >
        <Icon aria-hidden icon={panel.collapsed ? "hugeicons:plus-sign" : "hugeicons:minus-sign"} />
      </button>
      <div className="panel-content">
        <label className="board-title-field">
          <span className="board-kicker">InkLink board</span>
          <input
            aria-label="Board title"
            onBlur={onCommitTitle}
            onChange={(event) => onTitleChange(event.target.value)}
            value={boardTitle}
          />
        </label>
        <p>
          {stats.strokeCount} strokes · {Math.round(zoom * 100)}% zoom
        </p>
      </div>
    </aside>
  );
}
