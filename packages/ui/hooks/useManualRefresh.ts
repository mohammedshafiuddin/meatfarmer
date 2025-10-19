import { useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { REFRESH_EVENT } from '../src/lib/const-strs';

export default function useManualRefresh(callback: () => void) {
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(REFRESH_EVENT, callback);
    return () => subscription.remove();
  }, [callback]);
}