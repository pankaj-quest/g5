import { Kafka, logLevel } from 'kafkajs'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS.split(','),
  logLevel: env.NODE_ENV === 'production' ? logLevel.WARN : logLevel.INFO,
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
  logCreator: () => {
    return ({ log }) => {
      const { message, ...extra } = log
      logger.debug(`[kafka] ${message}`, extra)
    }
  },
})

export const kafkaEnabled = env.KAFKA_ENABLED
