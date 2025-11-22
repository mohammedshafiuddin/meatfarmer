import { useMemo } from 'react';
import Constants from 'expo-constants';

export const useIsDevMode = () => {
  return useMemo(() => {
    return !Constants.isDevice;
  }, []);
};