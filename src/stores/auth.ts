import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { clearApiCache } from '@/lib/api/client';
import { SJCET_BASE_URL, SJCET_COLLEGE } from '@/lib/api/endpoints';
import { clearAssignmentReminders } from '@/lib/notifications';
import type { Session } from '@/lib/api/types';
import { clearQueryCache } from '@/lib/query-client';
import { readJson, removeKey, STORAGE_KEYS, writeJson } from '@/lib/storage';
import { useProgress } from './progress';

const TOKEN_KEY = 'nexuslabs.access-token.v1';
const LEGACY_KEYS = [
  'etlab.access-token',
  'etlab.session.v1',
  'etlab.query-cache.v1',
  'etlab.colleges.v1',
  'etlab.onboarding.v1',
  'etlab.settings.v1',
] as const;

type PersistedSession = Omit<Session, 'token'>;

async function saveToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Secure storage can be unavailable on rooted/web previews. The in-memory
    // session still works for the current launch.
  }
}

async function loadToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Never persist the password or the access token inside the JSON blob. */
function toPersisted(session: Session): PersistedSession {
  const { token: _token, ...rest } = session;
  return {
    ...rest,
    profile: { ...session.profile, username: undefined, password: undefined, accessToken: undefined },
  };
}

/** Reject corrupt or obsolete session blobs instead of letting screens crash. */
function isPersistedSession(value: unknown): value is PersistedSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const college = record.college;
  const profile = record.profile;
  return (
    record.baseUrl === SJCET_BASE_URL &&
    record.demo !== true &&
    Boolean(college) &&
    typeof college === 'object' &&
    !Array.isArray(college) &&
    (college as Record<string, unknown>).base_url === SJCET_COLLEGE.base_url &&
    Boolean(profile) &&
    typeof profile === 'object' &&
    !Array.isArray(profile)
  );
}

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>()((set, get) => ({
  session: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    await Promise.all(LEGACY_KEYS.map((key) => removeKey(key)));
    const stored = await readJson<unknown>(STORAGE_KEYS.session);
    const persisted = isPersistedSession(stored) ? stored : null;
    const token = await loadToken();

    if (!persisted) {
      await removeKey(STORAGE_KEYS.session);
      await saveToken(null);
      await clearQueryCache();
    }

    if (persisted && token) {
      set({ session: { ...persisted, baseUrl: SJCET_BASE_URL, college: SJCET_COLLEGE, token }, hydrated: true });
      return;
    }

    if (persisted && !token) {
      await removeKey(STORAGE_KEYS.session);
      await clearQueryCache();
    }
    set({ session: null, hydrated: true });
  },

  signIn: async (session) => {
    if (session.baseUrl !== SJCET_BASE_URL || session.college.base_url !== SJCET_COLLEGE.base_url) {
      throw new Error('Only the SJCET Palai Etlab portal can be used with NexusLabs.');
    }
    const safeSession = { ...session, baseUrl: SJCET_BASE_URL, college: SJCET_COLLEGE };
    await clearAssignmentReminders();
    useProgress.getState().clear();
    await writeJson(STORAGE_KEYS.session, toPersisted(safeSession));
    await saveToken(safeSession.token);
    clearApiCache();
    await clearQueryCache();
    set({ session: safeSession, hydrated: true });
  },

  signOut: async () => {
    await clearAssignmentReminders();
    useProgress.getState().clear();
    await removeKey(STORAGE_KEYS.session);
    await saveToken(null);
    clearApiCache();
    await clearQueryCache();
    set({ session: null, hydrated: true });
  },
}));

export function useSession(): Session {
  const session = useAuth((state) => state.session);
  if (!session) {
    throw new Error('useSession used outside an authenticated screen');
  }
  return session;
}
