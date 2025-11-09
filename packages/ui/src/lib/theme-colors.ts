

export const colors = {
    blue1: '#F83758',
    blue2: '#fff0f6',
    pink1: '#F83758',
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