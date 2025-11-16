import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export const useMarkDataFetchers = (callback: () => void) => {
  const focusCountRef = useRef(0);

  useFocusEffect(
    useCallback(() => {

      console.log({count: focusCountRef.current})
      
      if (focusCountRef.current > 1) {
        callback();
      }
      focusCountRef.current += 1;
    },[])
  )
}