export type Point = {
  x: number;
  y: number;
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export type Tool = "pen" | "eraser" | "pan";

export type StrokeTool = "pen" | "eraser";

export type Stroke = {
  color: string;
  id: string;
  points: Point[];
  size: number;
  tool: StrokeTool;
};

export type FloatingPanelState = {
  collapsed: boolean;
  position: Point;
};

export type FloatingPanels = {
  board: FloatingPanelState;
  tools: FloatingPanelState;
};

export type PanIndicatorState = {
  horizontal: "left" | "right" | null;
  hidden: boolean;
  vertical: "bottom" | "top" | null;
};

export type BoardStats = {
  redoCount: number;
  strokeCount: number;
};

export type Interaction =
  | {
      lastScreen: Point;
      mode: "pan";
    }
  | {
      mode: "draw";
      stroke: Stroke;
    }
  | {
      mode: "erase";
    };
