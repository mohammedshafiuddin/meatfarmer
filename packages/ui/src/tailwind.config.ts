import type { Config } from "tailwindcss";
import { colors } from "./lib/theme-colors";
colors

const tailwindConfig: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Theme colors directly available
        ...colors,
      },
    },
  },
  plugins: [],
};

export default tailwindConfig;
