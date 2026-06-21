import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData } from '../types';

const STORAGE_KEY = '@volt/app-data/v1';

export interface AppDataStore {
  load: () => Promise<AppData | null>;
  save: (data: AppData) => Promise<void>;
  clear: () => Promise<void>;
}

export const localAppDataStore: AppDataStore = {
  async load() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AppData;
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },
  async save(data) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  async clear() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
