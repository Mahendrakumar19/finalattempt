/**
 * High-Performance In-Memory Cache Service
 * Provides O(1) in-RAM caching with TTL and Tag/Namespace-based instant invalidation.
 * Zero external dependencies, ultra-fast response (<0.2ms).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tag?: string;
}

class MemoryCacheService {
  private store = new Map<string, CacheEntry<any>>();
  private tagMap = new Map<string, Set<string>>();

  /**
   * Get an item from the cache.
   * Returns undefined if missing or expired.
   */
  public get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Put an item into cache with TTL (in seconds) and optional namespace tag.
   */
  public set<T>(key: string, value: T, ttlSeconds: number = 300, tag?: string): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt, tag });

    if (tag) {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    }
  }

  /**
   * Delete a specific cache key.
   */
  public delete(key: string): void {
    const entry = this.store.get(key);
    if (entry && entry.tag) {
      const set = this.tagMap.get(entry.tag);
      if (set) {
        set.delete(key);
        if (set.size === 0) this.tagMap.delete(entry.tag);
      }
    }
    this.store.delete(key);
  }

  /**
   * Instantly invalidate all keys belonging to a tag/namespace.
   * e.g. invalidateTag('blogs'), invalidateTag('settings'), invalidateTag('quizzes')
   */
  public invalidateTag(tag: string): void {
    const keys = this.tagMap.get(tag);
    if (keys) {
      for (const k of keys) {
        this.store.delete(k);
      }
      this.tagMap.delete(tag);
    }
  }

  /**
   * Invalidate all keys starting with a prefix.
   */
  public invalidatePrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.delete(key);
      }
    }
  }

  /**
   * Clear entire cache.
   */
  public clear(): void {
    this.store.clear();
    this.tagMap.clear();
  }

  /**
   * Cache wrapper for async functions (read-through cache pattern)
   */
  public async wrap<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300,
    tag?: string
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fetcher();
    if (result !== undefined && result !== null) {
      this.set(key, result, ttlSeconds, tag);
    }
    return result;
  }
}

export const memoryCache = new MemoryCacheService();
export default memoryCache;
