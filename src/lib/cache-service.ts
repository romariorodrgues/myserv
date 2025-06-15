/**
 * Cache service for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Simple in-memory cache with TTL support
 */

interface CacheItem<T> {
  data: T
  expiresAt: number
}

class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map()

  /**
   * Set a value in cache with TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 3600): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, {
      data: value,
      expiresAt
    })
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all expired items
   */
  cleanup(): number {
    const now = Date.now()
    let deletedCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getStats(): {
    totalItems: number
    expiredItems: number
    memoryUsage: string
  } {
    const now = Date.now()
    let expiredItems = 0

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expiredItems++
      }
    }

    return {
      totalItems: this.cache.size,
      expiredItems,
      memoryUsage: `${Math.round(JSON.stringify([...this.cache.entries()]).length / 1024)} KB`
    }
  }

  /**
   * Get or set pattern - if key exists return it, otherwise compute and cache
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== null) {
      return cached
    }

    const computed = await computeFn()
    this.set(key, computed, ttlSeconds)
    return computed
  }
}

// Create global cache instances
export const geocodingCache = new CacheService()
export const distanceCache = new CacheService()
export const notificationCache = new CacheService()

// Cleanup expired items every 5 minutes
setInterval(() => {
  geocodingCache.cleanup()
  distanceCache.cleanup()
  notificationCache.cleanup()
}, 5 * 60 * 1000)

export default CacheService
