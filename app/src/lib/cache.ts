// Two-level cache for fetch helpers: in-memory Map (singleton, fast) +
// localStorage (survives F5). Stale-while-revalidate pattern: a hit returns
// the cached value immediately while a background refresh updates the cache
// for the next read.
//
// Why: every navigation remounts components, which fires the same fetches
// again. Without a cache the user sees an empty-state flash for 200-500ms.
// localStorage extends that benefit across full reloads.
//
// JSON-friendly only — for VaultData (PublicKey/BigInt) we keep a separate
// custom-serialized cache in useBrix.

type Entry<T = unknown> = { data: T; expires: number };

const cache = new Map<string, Entry>();
const PERSIST_PREFIX = "brix:cache:";
const DEFAULT_TTL_MS = 20_000;
// localStorage entries are kept up to 5 minutes; in-memory expires sooner so
// background refresh keeps things fresh, but cold starts (F5) still get an
// instant paint from disk.
const PERSIST_TTL_MS = 5 * 60_000;

function persistKey(key: string): string {
  return `${PERSIST_PREFIX}${key}`;
}

function readPersisted<T>(key: string): Entry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(persistKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (parsed.expires < Date.now()) {
      window.localStorage.removeItem(persistKey(key));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePersisted<T>(key: string, data: T, ttlMs: number) {
  if (typeof window === "undefined") return;
  try {
    const entry: Entry<T> = { data, expires: Date.now() + ttlMs };
    window.localStorage.setItem(persistKey(key), JSON.stringify(entry));
  } catch {
    // localStorage quota or other; silently fall back to in-memory only
  }
}

export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  // 1. In-memory hit — instantly fresh.
  const memHit = cache.get(key);
  if (memHit && memHit.expires > Date.now()) {
    return memHit.data as T;
  }

  // 2. Persisted hit — return immediately, refresh in background.
  //    This is the path that makes F5 feel instant.
  const persisted = readPersisted<T>(key);
  if (persisted) {
    cache.set(key, persisted);
    void loader()
      .then((fresh) => {
        const expires = Date.now() + ttlMs;
        cache.set(key, { data: fresh, expires });
        writePersisted(key, fresh, PERSIST_TTL_MS);
      })
      .catch(() => {
        // Background refresh failed — keep stale; will retry on next read.
      });
    return persisted.data as T;
  }

  // 3. Cold path — fetch and persist.
  const data = await loader();
  const expires = Date.now() + ttlMs;
  cache.set(key, { data, expires });
  writePersisted(key, data, PERSIST_TTL_MS);
  return data;
}

/** Drop every entry whose key starts with `prefix`, both layers. */
export function invalidate(prefix: string) {
  for (const k of [...cache.keys()]) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
  if (typeof window !== "undefined") {
    try {
      const persistPrefix = persistKey(prefix);
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(persistPrefix)) toRemove.push(k);
      }
      for (const k of toRemove) window.localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
}

/** Drop everything (rare — used on logout). */
export function clearAll() {
  cache.clear();
  if (typeof window !== "undefined") {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(PERSIST_PREFIX)) toRemove.push(k);
      }
      for (const k of toRemove) window.localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
}
