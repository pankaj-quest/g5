import Redis from 'ioredis'
import { env } from '../../config/env.js'
import { logger } from '../../utils/logger.js'

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null // stop retrying after 3 attempts
    return Math.min(times * 200, 2000)
  },
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => {
  // Suppress repeated connection errors — just log once
  if (err.message?.includes('ECONNREFUSED')) {
    logger.debug('Redis unavailable')
  } else {
    logger.error('Redis error', err)
  }
})
