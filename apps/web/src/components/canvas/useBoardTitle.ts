import { useAsyncDebouncedCallback } from "@tanstack/react-pacer";
import { useCallback, useEffect, useRef, useState } from "react";

const defaultBoardTitle = "Untitled infinite canvas";

const persistBoardTitle = async (_title: string) => {
  // API boundary: replace with the board update endpoint once persistence exists.
};

export const useBoardTitle = () => {
  const [boardTitle, setBoardTitle] = useState(defaultBoardTitle);
  const lastSavedTitleRef = useRef(defaultBoardTitle);

  const persistTitle = useAsyncDebouncedCallback(
    async (nextTitle: string) => {
      await persistBoardTitle(nextTitle);
      lastSavedTitleRef.current = nextTitle;
    },
    {
      wait: 650
    }
  );

  useEffect(() => {
    document.title = `${boardTitle.trim() || defaultBoardTitle} · InkLink`;
  }, [boardTitle]);

  const commitBoardTitle = useCallback(() => {
    const nextTitle = boardTitle.trim() || defaultBoardTitle;

    setBoardTitle(nextTitle);

    if (nextTitle !== lastSavedTitleRef.current) {
      void persistTitle(nextTitle);
    }
  }, [boardTitle, persistTitle]);

  return {
    boardTitle,
    commitBoardTitle,
    setBoardTitle
  };
};
