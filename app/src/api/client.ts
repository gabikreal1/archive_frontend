import { handleMockRequest } from './mock-server';
import { useUserStore } from '@/state/user';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
const FORCE_MOCK =
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === '1' ||
  process.env.NEXT_PUBLIC_OFFLINE_MODE === 'mock';

const SHOULD_USE_MOCK =
  FORCE_MOCK || !process.env.NEXT_PUBLIC_API_BASE || BASE_URL.includes('placeholder.arc');

function buildHeaders(existing?: HeadersInit) {
  const headers = new Headers(existing ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = useUserStore.getState().accessToken;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function handle<T>(path: string, init?: RequestInit): Promise<T> {
  if (SHOULD_USE_MOCK) {
    return Promise.resolve(handleMockRequest<T>(path, init));
  }

  if (FORCE_MOCK) {
    return Promise.resolve(handleMockRequest<T>(path, init));
  }

  const target = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  try {
    const response = await fetch(target, {
      ...init,
      headers: buildHeaders(init?.headers)
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to mock API for', path, error);
      return Promise.resolve(handleMockRequest<T>(path, init));
    }
    throw error;
  }
}

export const apiClient = {
  post: <T>(path: string, body?: unknown) =>
    handle<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),
  get: <T>(path: string) => handle<T>(path, { method: 'GET' }),
  stream(path: string) {
    if (SHOULD_USE_MOCK) {
      console.warn('WebSocket stream requested while offline; returning mock stub.');
      return {
        close: () => undefined,
        send: () => undefined
      } as unknown as WebSocket;
    }
    return new WebSocket(path.startsWith('ws') ? path : path.replace('https', 'wss'));
  }
};
