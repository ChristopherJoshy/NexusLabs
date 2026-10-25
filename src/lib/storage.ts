import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is best-effort. Losing a cache entry must never break a screen.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // no-op
  }
}

export const STORAGE_KEYS = {
  session: 'nexuslabs.session.v1',
  settings: 'nexuslabs.settings.v2',
  queryCache: 'nexuslabs.query-cache.v1',
  progress: 'nexuslabs.progress.v1',
} as const;
