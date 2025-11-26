import React, { createContext, useContext } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { REFRESH_EVENT } from '../lib/const-strs';

const RefreshContext = createContext<{ refreshAll: () => void } | null>(null);

export const RefreshProvider: React.FC<{ children: React.ReactNode; queryClient: any }> = ({ children, queryClient }) => {
  const refreshAll = () => {
    queryClient.clear();
    DeviceEventEmitter.emit(REFRESH_EVENT);
  };
  return <RefreshContext.Provider value={{ refreshAll }}>{children}</RefreshContext.Provider>;
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) throw new Error('useRefresh must be used within RefreshProvider');
  return context;
};