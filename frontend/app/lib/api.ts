import { getToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache store
const memoryCache = new Map<string, CacheEntry<unknown>>();
const SESSION_CACHE_PREFIX = "sp_cache_";
const DEFAULT_TTL = 60 * 1000; // 60 seconds TTL

function getCacheKey(path: string): string {
  return `${SESSION_CACHE_PREFIX}${path}`;
}

function getFromStorage<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function setToStorage<T>(key: string, entry: CacheEntry<T>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // SessionStorage full or restricted
  }
}

function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Returns synchronous cached data if available (valid or stale).
 * Useful for instant UI initialization.
 */
export function getSynchronousCache<T>(path: string): T | null {
  const memKey = path;
  const storageKey = getCacheKey(path);

  const memEntry = memoryCache.get(memKey) as CacheEntry<T> | undefined;
  if (memEntry) return memEntry.data;

  const storageEntry = getFromStorage<T>(storageKey);
  if (storageEntry) {
    memoryCache.set(memKey, storageEntry);
    return storageEntry.data;
  }

  // Cross-alias lookup between /projects/ and /pools/
  if (path.startsWith("/projects/")) {
    const aliasKey = path.replace("/projects/", "/pools/");
    const aliasMem = memoryCache.get(aliasKey) as CacheEntry<T> | undefined;
    if (aliasMem) return aliasMem.data;
    const aliasStorage = getFromStorage<T>(getCacheKey(aliasKey));
    if (aliasStorage) return aliasStorage.data;
  } else if (path.startsWith("/pools/")) {
    const aliasKey = path.replace("/pools/", "/projects/");
    const aliasMem = memoryCache.get(aliasKey) as CacheEntry<T> | undefined;
    if (aliasMem) return aliasMem.data;
    const aliasStorage = getFromStorage<T>(getCacheKey(aliasKey));
    if (aliasStorage) return aliasStorage.data;
  }

  return null;
}

/**
 * Manually seed or update cache for a path.
 */
export function setSynchronousCache<T>(path: string, data: T, ttl: number = DEFAULT_TTL): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
  memoryCache.set(path, entry as CacheEntry<unknown>);
  setToStorage(getCacheKey(path), entry);
}

/**
 * Invalidate cache entries matching a path or regex pattern.
 */
export function invalidateApiCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    if (typeof window !== "undefined") {
      try {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith(SESSION_CACHE_PREFIX)) {
            sessionStorage.removeItem(key);
          }
        });
      } catch {}
    }
    return;
  }

  const isRegex = pattern instanceof RegExp;
  memoryCache.forEach((_, key) => {
    if (isRegex ? pattern.test(key) : key.includes(pattern)) {
      memoryCache.delete(key);
    }
  });

  if (typeof window !== "undefined") {
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(SESSION_CACHE_PREFIX)) {
          const rawPath = key.replace(SESSION_CACHE_PREFIX, "");
          if (isRegex ? pattern.test(rawPath) : rawPath.includes(pattern)) {
            sessionStorage.removeItem(key);
          }
        }
      });
    } catch {}
  }
}

function resolveMutationScope(path: string): string | RegExp | undefined {
  if (path.includes("/collaborators")) return /collaborator|split|pool|project/;
  if (path.includes("/splits") || path.includes("/split")) return /split|pool|project|collaborator/;
  if (path.includes("/payments") || path.includes("/transactions")) return /payment|transaction|balance|pool|project/;
  if (path.includes("/withdrawals")) return /withdrawal|balance|pool|project/;
  if (path.includes("/pools") || path.includes("/projects")) return /pool|project/;
  if (path.includes("/notifications")) return /notification/;
  return undefined;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? `HTTP ${res.status}`);
  }

  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

export interface FetchOptions {
  ttl?: number;
  forceFresh?: boolean;
  backgroundRevalidate?: boolean;
}

export const api = {
  get: async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
    const { ttl = DEFAULT_TTL, forceFresh = false } = options;
    const memKey = path;
    const storageKey = getCacheKey(path);
    const now = Date.now();

    if (!forceFresh) {
      const cached = memoryCache.get(memKey) as CacheEntry<T> | undefined || getFromStorage<T>(storageKey);
      if (cached) {
        memoryCache.set(memKey, cached);
        // If cache is fresh, return immediately
        if (now - cached.timestamp < (cached.ttl || ttl)) {
          return cached.data;
        }
      }
    }

    // Fetch fresh data
    const data = await request<T>(path);
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    memoryCache.set(memKey, entry as CacheEntry<unknown>);
    setToStorage(storageKey, entry);

    // If fetching pools list, automatically pre-seed individual pool cache
    if ((path === "/pools" || path === "/projects") && Array.isArray(data)) {
      data.forEach((p: any) => {
        if (p && p.id) {
          setSynchronousCache(`/projects/${p.id}`, p, ttl);
          setSynchronousCache(`/pools/${p.id}`, p, ttl);
        }
      });
    }

    return data;
  },

  getCached: <T>(path: string): T | null => getSynchronousCache<T>(path),
  setCached: <T>(path: string, data: T, ttl?: number): void => setSynchronousCache<T>(path, data, ttl),

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const data = await request<T>(path, { method: "POST", body: JSON.stringify(body) });
    const scope = resolveMutationScope(path);
    invalidateApiCache(scope);
    return data;
  },

  patch: async <T>(path: string, body: unknown): Promise<T> => {
    const data = await request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
    const scope = resolveMutationScope(path);
    invalidateApiCache(scope);
    return data;
  },

  delete: async <T>(path: string): Promise<T> => {
    const data = await request<T>(path, { method: "DELETE" });
    const scope = resolveMutationScope(path);
    invalidateApiCache(scope);
    return data;
  },

  invalidateCache: (pattern?: string | RegExp) => invalidateApiCache(pattern),

  getMe: (options?: FetchOptions) => api.get<any>("/users/me", options),
  getPools: async (options?: FetchOptions) => {
    const data = await api.get<any>("/pools", options);
    if (Array.isArray(data)) {
      data.forEach((p: any) => {
        if (p && p.id) {
          setSynchronousCache(`/projects/${p.id}`, p);
          setSynchronousCache(`/pools/${p.id}`, p);
        }
      });
    }
    return data;
  },
  getNotifications: (options?: FetchOptions) => api.get<any>("/notifications", options),

  googleAuth: async (credential: string, invitationToken?: string) => {
    const body: Record<string, string> = { credential };
    if (invitationToken) body.invitationToken = invitationToken;
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new ApiError(res.status, json?.error?.message ?? json?.message ?? "Google auth failed");
    }
    invalidateApiCache();
    return json.data;
  },
};
