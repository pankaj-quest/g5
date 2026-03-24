import { pubsub, SUB_REALTIME_FAN } from '../client.js'
import { broadcastEvent } from '../../services/realtime/broadcast.service.js'
import { redis } from '../../services/realtime/redis.js'
import { logger } from '../../utils/logger.js'
import type { Message } from '@google-cloud/pubsub'

/**
 * Realtime fan-out consumer.
 * Receives same events as the writer, but instead of writing to MongoDB,
 * pushes them to Socket.io rooms via Redis for live dashboards.
 */
export function startRealtimeFanConsumer(): void {
  const subscription = pubsub.subscription(SUB_REALTIME_FAN, {
    flowControl: {
      maxMessages: 500,
      allowExcessMessages: false,
    },
  })

  subscription.on('message', (message: Message) => {
    try {
      const raw = JSON.parse(message.data.toString())
      const projectId = raw.projectId || message.attributes.projectId
      const props = raw.properties || {}

      // Broadcast to Socket.io
      broadcastEvent(projectId, {
        event: raw.event,
        distinctId: String(props.distinct_id || props['$distinct_id'] || 'anonymous'),
        time: new Date().toISOString(),
        properties: props,
      }).catch(() => null)

      // Increment realtime stats counter
      redis.incr(`stats:epm:${projectId}`).catch(() => null)

      message.ack()
    } catch (err) {
      logger.error('Realtime fan: failed to process message', { err })
      message.ack()
    }
  })

  subscription.on('error', (err) => {
    logger.error('Realtime fan subscription error', { err })
  })

  logger.info('Realtime fan consumer started')
}
