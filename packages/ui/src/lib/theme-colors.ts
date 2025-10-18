export type colorsType = {
    blue1: string;
    blue2: string;
    blue3: string;
    red1: string;
    green1: string;
    green2: string;
    black1: string;
    black2: string;
    white1: string;
    yellow1: string;
    yellow2: string;
    gray1: string;
    gray2: string;
    gray3: string;
    gray4: string;
    error: string; // alias for red1
    // Add more color properties as needed
  };

export const colors:colorsType = {
    blue1: '#1C352D',
    blue2: '#A6B28B',
    blue3: '#ECF4FF',
    red1: '#D84343',
    green1: '#4CAF50',
    green2: '#C8F4D3',
    black1: '#000000',
    black2: '#1A1C1E',
    white1: '#FFFFFF',
    gray1: '#6E7580',
    gray2: '#D9D9D9',
    gray3: '#F5F5F5',
    gray4: '#6C7278',
    yellow1: '#FFB74D', 
    yellow2: '#FFE3AD',
    get error() { return this.red1; }, // alias, not hardcoded
  }