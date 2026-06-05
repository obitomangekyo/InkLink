import { useHotkeys } from "@tanstack/react-hotkeys";
import { useCallback } from "react";

import type { Tool } from "./types";

type UseCanvasHotkeysArgs = {
  onClear: () => void;
  onRedo: () => void;
  onSelectTool: (tool: Tool) => void;
  onUndo: () => void;
};

export const useCanvasHotkeys = ({
  onClear,
  onRedo,
  onSelectTool,
  onUndo
}: UseCanvasHotkeysArgs) => {
  const selectPen = useCallback(() => onSelectTool("pen"), [onSelectTool]);
  const selectEraser = useCallback(() => onSelectTool("eraser"), [onSelectTool]);
  const selectPan = useCallback(() => onSelectTool("pan"), [onSelectTool]);
  const noop = useCallback(() => undefined, []);

  useHotkeys(
    [
      {
        callback: onUndo,
        hotkey: "Mod+Z",
        options: { meta: { name: "Undo", description: "Undo the last stroke" } }
      },
      {
        callback: onRedo,
        hotkey: "Mod+Shift+Z",
        options: { meta: { name: "Redo", description: "Redo the last undone stroke" } }
      },
      {
        callback: onClear,
        hotkey: "Mod+Backspace",
        options: { meta: { name: "Clear board", description: "Remove all strokes" } }
      },
      {
        callback: selectPen,
        hotkey: "B",
        options: { meta: { name: "Pen", description: "Switch to the pen tool" } }
      },
      {
        callback: selectEraser,
        hotkey: "E",
        options: { meta: { name: "Eraser", description: "Switch to the eraser tool" } }
      },
      {
        callback: selectPan,
        hotkey: "H",
        options: { meta: { name: "Pan", description: "Switch to the pan tool" } }
      },
      {
        callback: noop,
        hotkey: "Space",
        options: { meta: { name: "Hold pan", description: "Temporarily pan the board" } }
      }
    ],
    { ignoreInputs: true, preventDefault: true }
  );
};
