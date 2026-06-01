import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
  presets: [presetWind4()],
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
