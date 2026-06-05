import { useCallback, useEffect, useState } from "react";

import { clamp } from "./canvasMath";
import type { FloatingPanels, Point } from "./types";

const panelStorageKey = "inklink:board-shell-panels:v1";
const panelMargin = 16;
const estimatedToolsWidth = 420;

const defaultPanels = (): FloatingPanels => ({
  board: {
    collapsed: false,
    position: { x: panelMargin, y: panelMargin }
  },
  tools: {
    collapsed: false,
    position: {
      x: Math.max(panelMargin, window.innerWidth - estimatedToolsWidth - panelMargin),
      y: panelMargin
    }
  }
});

const loadPanelState = (): FloatingPanels => {
  try {
    const storedPanels = localStorage.getItem(panelStorageKey);

    if (!storedPanels) {
      return defaultPanels();
    }

    return { ...defaultPanels(), ...JSON.parse(storedPanels) };
  } catch {
    return defaultPanels();
  }
};

const clampPanelPosition = (position: Point, panelWidth = 80, panelHeight = 72): Point => ({
  x: clamp(position.x, 8, Math.max(8, window.innerWidth - panelWidth - 8)),
  y: clamp(position.y, 8, Math.max(8, window.innerHeight - panelHeight - 8))
});

export const clampFloatingPanelPosition = clampPanelPosition;

export const useFloatingPanels = () => {
  const [panels, setPanels] = useState<FloatingPanels>(loadPanelState);

  const registerToolsPanel = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();

    setPanels((currentPanels) => {
      const nextPosition = clampPanelPosition(
        {
          x: window.innerWidth - rect.width - panelMargin,
          y: currentPanels.tools.position.y
        },
        rect.width,
        rect.height
      );

      return {
        ...currentPanels,
        tools: {
          ...currentPanels.tools,
          position: nextPosition
        }
      };
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(panelStorageKey, JSON.stringify(panels));
  }, [panels]);

  useEffect(() => {
    const handleResize = () => {
      setPanels((currentPanels) => ({
        board: {
          ...currentPanels.board,
          position: clampPanelPosition(currentPanels.board.position)
        },
        tools: {
          ...currentPanels.tools,
          position: clampPanelPosition(currentPanels.tools.position, estimatedToolsWidth)
        }
      }));
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    panels,
    registerToolsPanel,
    setPanels
  };
};
