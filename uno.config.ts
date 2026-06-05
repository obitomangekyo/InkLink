import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
  presets: [presetWind4()],
  shortcuts: {
    "ink-button":
      "inline-flex items-center justify-center gap-2 border-2 border-ink rounded-[7px] text-ink font-800",
    "ink-icon-button": "ink-button h-9 w-9 p-0",
    "ink-panel": "fixed z-2 border-2 border-ink rounded-2 bg-[#fff8e8] text-ink",
    "ink-tool-button": "ink-button min-h-38px px-3 bg-[#fffdf6] capitalize"
  },
  theme: {
    colors: {
      ink: "#211b17",
      paper: "#fbf7ec",
      clay: "#e4572e",
      pond: "#2f6f9f",
      moss: "#8fb9a8",
      gold: "#f2c14e"
    }
  }
});
