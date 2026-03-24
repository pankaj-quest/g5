import { pubsub, pubsubEnabled, TOPIC_EVENTS, TOPIC_PROFILES, TOPIC_GROUPS, TOPIC_IDENTITY, TOPIC_DLQ } from './client.js'
import { logger } from '../utils/logger.js'
import type { Topic } from '@google-cloud/pubsub'

const topicCache = new Map<string, Topic>()

function getTopic(name: string): Topic {
  let topic = topicCache.get(name)
  if (!topic) {
    topic = pubsub.topic(name, {
      batching: {
        maxMessages: 1000,      // batch up to 1000 messages
        maxMilliseconds: 100,   // or flush every 100ms
        maxBytes: 5 * 1024 * 1024, // or 5MB
      },
    })
    topicCache.set(name, topic)
  }
  return topic
}

/**
 * Publish a single message. Returns immediately after queueing.
 * Pub/Sub client handles batching internally.
 */
export async function publishEvent(projectId: string, payload: Record<string, unknown>): Promise<void> {
  if (!pubsubEnabled) return

  const topic = getTopic(TOPIC_EVENTS)
  const data = Buffer.from(JSON.stringify(payload))

  // Non-blocking: topic.publishMessage returns a promise but we don't await batch flush
  topic.publishMessage({
    data,
    attributes: { projectId },
    orderingKey: projectId, // ensures ordering per project
  }).catch((err) => {
    logger.error('Failed to publish event to Pub/Sub', { err })
  })
}

/**
 * Publish batch of events. Each message is individually queued.
 * Pub/Sub batching handles the actual network calls.
 */
export async function publishEventBatch(projectId: string, events: Record<string, unknown>[]): Promise<void> {
  if (!pubsubEnabled) return

  const topic = getTopic(TOPIC_EVENTS)

  for (const event of events) {
    topic.publishMessage({
      data: Buffer.from(JSON.stringify(event)),
      attributes: { projectId },
      orderingKey: projectId,
    }).catch((err) => {
      logger.error('Failed to publish batch event to Pub/Sub', { err })
    })
  }
}

export async function publishProfileUpdate(projectId: string, payload: Record<string, unknown>): Promise<void> {
  if (!pubsubEnabled) return
  const topic = getTopic(TOPIC_PROFILES)
  topic.publishMessage({
    data: Buffer.from(JSON.stringify(payload)),
    attributes: { projectId },
  }).catch((err) => logger.error('Failed to publish profile update', { err }))
}

export async function publishGroupUpdate(projectId: string, payload: Record<string, unknown>): Promise<void> {
  if (!pubsubEnabled) return
  const topic = getTopic(TOPIC_GROUPS)
  topic.publishMessage({
    data: Buffer.from(JSON.stringify(payload)),
    attributes: { projectId },
  }).catch((err) => logger.error('Failed to publish group update', { err }))
}

export async function publishIdentityMerge(projectId: string, deviceId: string, userId: string): Promise<void> {
  if (!pubsubEnabled) return
  const topic = getTopic(TOPIC_IDENTITY)
  topic.publishMessage({
    data: Buffer.from(JSON.stringify({ projectId, deviceId, userId })),
    attributes: { projectId },
  }).catch((err) => logger.error('Failed to publish identity merge', { err }))
}

export async function publishToDLQ(originalMessage: string, error: string): Promise<void> {
  const topic = getTopic(TOPIC_DLQ)
  topic.publishMessage({
    data: Buffer.from(originalMessage),
    attributes: { error: error.slice(0, 200) },
  }).catch(() => null)
}
