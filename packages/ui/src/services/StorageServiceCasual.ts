import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Helper to detect if we're on web
const isWeb = Platform.OS === 'web';

// Helper to prepend web prefix for web keys
const getWebKey = (key: string): string => `web_${key}`;

export const StorageServiceCasual = {
  async setItem(key: string, value: string): Promise<boolean> {
    try {
      const storageKey = isWeb ? getWebKey(key) : key;

      if (isWeb) {
        localStorage.setItem(storageKey, value);
      } else {
        await SecureStore.setItemAsync(storageKey, value);
      }
      return true;
    } catch (e) {
      console.error('StorageServiceCasual setItem error:', e);
      return false;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const storageKey = isWeb ? getWebKey(key) : key;

      if (isWeb) {
        return localStorage.getItem(storageKey);
      } else {
        return await SecureStore.getItemAsync(storageKey);
      }
    } catch (e) {
      console.error('StorageServiceCasual getItem error:', e);
      return null;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      const storageKey = isWeb ? getWebKey(key) : key;

      if (isWeb) {
        localStorage.removeItem(storageKey);
      } else {
        await SecureStore.deleteItemAsync(storageKey);
      }
      return true;
    } catch (e) {
      console.error('StorageServiceCasual removeItem error:', e);
      return false;
    }
  },

  async clearAll(keys: string[]): Promise<boolean> {
    try {
      if (isWeb) {
        keys.forEach((key) => localStorage.removeItem(getWebKey(key)));
      } else {
        await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
      }
      return true;
    } catch (e) {
      console.error('StorageServiceCasual clearAll error:', e);
      return false;
    }
  },
};