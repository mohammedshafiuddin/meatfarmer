

export const colors = {
    brand25:  "#F5FAFF",
    brand50:  "#EFF8FF",
    brand100: "#D1E9FF",
    brand200: "#B2DDFF",
    brand300: "#84CAFF",
    brand400: "#53B1FD",
    brand500: "#2E90FA",
    brand600: "#1570EF",
    brand700: "#175CD3",
    brand800: "#1849A9",
    brand900: "#194185",
    blue1: '#2E90FA',
    blue2: '#fff0f6',
    pink1: '#2E90FA',
    pink2: '#fff0f6',
    blue3: '#ECF4FF',
    red1: '#D84343',
    green1: '#4CAF50',
    green2: '#C8F4D3',
    black1: '#000000',
    black2: '#1A1C1E',
    white1: '#FFFFFF',
    gray1: '#fdfdfd',
    gray2: '#f2f2f2',
    gray3: '#F5F5F5',
    gray4: '#6C7278',
    gray5: '#ced4da',
    yellow1: '#FFB74D', 
    yellow2: '#FFE3AD',
    get error() { return this.red1; }, // alias, not hardcoded
  }

export type colorsType = typeof colors;