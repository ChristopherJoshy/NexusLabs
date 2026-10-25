import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { STORAGE_KEYS } from './storage';

/**
 * One client for the whole app. Kept outside React so account transitions can
 * wipe both the in-memory cache and the persisted copy without importing a
 * provider component.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: STORAGE_KEYS.queryCache,
  throttleTime: 1_000,
});

/** Drop cached academic data when the signed-in account changes. */
export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  try {
    await queryPersister.removeClient();
  } catch {
    // A failed disk cleanup must not block sign-in or sign-out.
  }
}
