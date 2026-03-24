import { pubsub, pubsubEnabled, TOPIC_EVENTS, TOPIC_PROFILES, TOPIC_GROUPS, TOPIC_IDENTITY, TOPIC_DLQ, SUB_EVENT_WRITER, SUB_REALTIME_FAN, SUB_PROFILE_UPDATER, SUB_GROUP_UPDATER, SUB_IDENTITY_MERGE } from './client.js'
import { logger } from '../utils/logger.js'

interface TopicSub {
  topic: string
  subscriptions: string[]
}

const TOPOLOGY: TopicSub[] = [
  {
    topic: TOPIC_EVENTS,
    subscriptions: [SUB_EVENT_WRITER, SUB_REALTIME_FAN], // fan-out: same event goes to both
  },
  { topic: TOPIC_PROFILES, subscriptions: [SUB_PROFILE_UPDATER] },
  { topic: TOPIC_GROUPS, subscriptions: [SUB_GROUP_UPDATER] },
  { topic: TOPIC_IDENTITY, subscriptions: [SUB_IDENTITY_MERGE] },
  { topic: TOPIC_DLQ, subscriptions: [] },
]

export async function ensurePubSubTopics(): Promise<void> {
  if (!pubsubEnabled) {
    logger.info('Pub/Sub disabled — skipping topic creation')
    return
  }

  for (const { topic: topicName, subscriptions } of TOPOLOGY) {
    // Create topic if not exists
    const topic = pubsub.topic(topicName)
    const [topicExists] = await topic.exists()
    if (!topicExists) {
      await topic.create({
        messageRetentionDuration: { seconds: 7 * 24 * 3600 }, // 7 days
      })
      logger.info(`Created Pub/Sub topic: ${topicName}`)
    }

    // Create subscriptions
    for (const subName of subscriptions) {
      const sub = topic.subscription(subName)
      const [subExists] = await sub.exists()
      if (!subExists) {
        await sub.create({
          ackDeadlineSeconds: 60,
          retryPolicy: {
            minimumBackoff: { seconds: 10 },
            maximumBackoff: { seconds: 600 },
          },
          deadLetterPolicy: topicName !== TOPIC_DLQ ? {
            deadLetterTopic: pubsub.topic(TOPIC_DLQ).name,
            maxDeliveryAttempts: 5,
          } : undefined,
          enableExactlyOnceDelivery: false, // better throughput
        })
        logger.info(`Created Pub/Sub subscription: ${subName} → ${topicName}`)
      }
    }
  }

  logger.info('Pub/Sub topics and subscriptions ready')
}
