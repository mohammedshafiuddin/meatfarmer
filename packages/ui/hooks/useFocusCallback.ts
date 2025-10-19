import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

/**
 * Hook that calls a callback function when the current screen comes into focus
 * @param callback - Function to call when screen gains focus
 */
const useFocusCallback = (callback: () => void) => {
  useFocusEffect(
    useCallback(() => {
      callback();
    }, [callback])
  );
};

export default useFocusCallback;