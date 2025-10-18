import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Helper to detect if we're on web
const isWeb = Platform.OS === 'web';

export const StorageService = {
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
      return true;
    } catch (e) {
      console.error('StorageService setItem error:', e);
      return false;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (e) {
      console.error('StorageService getItem error:', e);
      return null;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
      return true;
    } catch (e) {
      console.error('StorageService removeItem error:', e);
      return false;
    }
  },

  async clearAll(keys: string[]): Promise<boolean> {
    try {
      if (isWeb) {
        keys.forEach((key) => localStorage.removeItem(key));
      } else {
        await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
      }
      return true;
    } catch (e) {
      console.error('StorageService clearAll error:', e);
      return false;
    }
  },
};