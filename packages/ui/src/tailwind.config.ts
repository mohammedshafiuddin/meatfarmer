import type { Config } from "tailwindcss";
import { theme } from "./theme";

const tailwindConfig: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Theme colors directly available
        ...theme.colors,
      },
    },
  },
  plugins: [],
};

export default tailwindConfig;
