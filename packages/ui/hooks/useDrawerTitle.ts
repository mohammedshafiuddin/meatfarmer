import { DependencyList, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export function useDrawerTitle(title: string, deps: DependencyList) {
  useFocusEffect(() => {
    DeviceEventEmitter.emit('updateDrawerTitle', title);
    return () => {
      DeviceEventEmitter.emit('updateDrawerTitle', undefined);
    };
  });

  useEffect(() => {
    DeviceEventEmitter.emit('updateDrawerTitle', title);
    return () => {
      DeviceEventEmitter.emit('updateDrawerTitle', undefined);
    }
  },[deps])
}