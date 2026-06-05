import type { PanIndicatorState } from "./types";

type PanIndicatorProps = {
  indicator: PanIndicatorState;
};

export function PanIndicator({ indicator }: PanIndicatorProps) {
  return (
    <div
      aria-hidden
      className="pan-indicator"
      data-hidden={indicator.hidden}
      data-horizontal={indicator.horizontal ?? "none"}
      data-vertical={indicator.vertical ?? "none"}
    />
  );
}
