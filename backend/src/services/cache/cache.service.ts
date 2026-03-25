import { redis } from '../realtime/redis.js'
import { logger } from '../../utils/logger.js'
import crypto from 'crypto'

/**
 * Generic Redis cache-aside helper.
 * Generates a deterministic cache key from the query params,
 * checks Redis first, and falls back to the compute function on miss.
 */
export async function cacheQuery<T>(
  prefix: string,
  params: Record<string, unknown>,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(params, Object.keys(params).sort()))
    .digest('hex')
    .slice(0, 16)

  const key = `cache:${prefix}:${hash}`

  if (redis.status === 'ready') {
    try {
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (err) {
      logger.warn('Redis cache read failed, falling back to compute', { key, err })
    }
  }

  const result = await compute()

  if (redis.status === 'ready') {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(result))
    } catch (err) {
      logger.warn('Redis cache write failed', { key, err })
    }
  }

  return result
}

/**
 * Invalidate all cache keys matching a pattern for a project.
 * Use after data mutations that affect cached queries.
 */
export async function invalidateProjectCache(projectId: string, prefix?: string): Promise<void> {
  try {
    const pattern = prefix
      ? `cache:${prefix}:*`
      : `cache:*`

    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  } catch (err) {
    logger.warn('Cache invalidation failed', { projectId, prefix, err })
  }
}

/**
 * Cache a single value by explicit key.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (err) {
    logger.warn('Redis cacheSet failed', { key, err })
  }
}
