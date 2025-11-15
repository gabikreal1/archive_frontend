import { create } from 'zustand';

interface UserState {
  userId?: string;
  email?: string;
  name?: string;
  accessToken?: string;
  authenticated: boolean;
  loading: boolean;
  hydrated: boolean;
  signIn: (email?: string) => Promise<void>;
  signOut: () => void;
  hydrate: () => void;
}

const OFFLINE_MODE =
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === '1' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'mock';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? 'user@example.com';
const STORAGE_KEY = 'arc-auth-token';

function persistAuth(payload?: { accessToken?: string; userId?: string; email?: string }) {
  if (typeof window === 'undefined') return;
  if (!payload || !payload.accessToken || !payload.userId) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ accessToken: payload.accessToken, userId: payload.userId, email: payload.email })
  );
}

export const useUserStore = create<UserState>((set, get) => ({
  authenticated: false,
  loading: false,
  hydrated: typeof window === 'undefined' ? true : false,
  hydrate() {
    if (get().hydrated) return;
    if (typeof window === 'undefined') {
      set({ hydrated: true });
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const data = JSON.parse(raw) as { accessToken?: string; userId?: string; email?: string };
      if (data.accessToken && data.userId) {
        set({
          authenticated: true,
          accessToken: data.accessToken,
          userId: data.userId,
          email: data.email ?? data.userId,
          name: data.email ?? data.userId,
          hydrated: true,
          loading: false
        });
      } else {
        set({ hydrated: true });
      }
    } catch (error) {
      console.warn('Failed to hydrate auth state', error);
      set({ hydrated: true });
    }
  },
  async signIn(email?: string) {
    set({ loading: true });
    try {
      if (OFFLINE_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const offlinePayload = {
          authenticated: true,
          loading: false,
          userId: 'demo-user',
          email: email ?? DEMO_EMAIL,
          name: 'Offline Pilot',
          accessToken: 'offline-token',
          hydrated: true
        } as const;
        set(offlinePayload);
        persistAuth({ accessToken: 'offline-token', userId: 'demo-user', email: email ?? DEMO_EMAIL });
        return;
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email ?? DEMO_EMAIL })
      });

      if (!response.ok) {
        throw new Error(`Login failed (${response.status})`);
      }

      const data = (await response.json()) as { accessToken: string; userId: string };
      set({
        authenticated: true,
        loading: false,
        userId: data.userId,
        email: data.userId,
        name: data.userId,
        accessToken: data.accessToken,
        hydrated: true
      });
      persistAuth({ accessToken: data.accessToken, userId: data.userId, email: data.userId });
    } catch (error) {
      console.error('Sign-in error', error);
      set({ loading: false, authenticated: false, accessToken: undefined, hydrated: true });
      throw error;
    }
  },
  signOut() {
    persistAuth();
    set({ authenticated: false, userId: undefined, accessToken: undefined, hydrated: true });
  }
}));
