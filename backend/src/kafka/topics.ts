import { kafka, kafkaEnabled } from './client.js'
import {
  KAFKA_EVENTS_TOPIC,
  KAFKA_PROFILES_TOPIC,
  KAFKA_GROUPS_TOPIC,
  KAFKA_IDENTITY_TOPIC,
  KAFKA_DLQ_TOPIC,
} from '../config/constants.js'
import { logger } from '../utils/logger.js'

const TOPICS = [
  { topic: KAFKA_EVENTS_TOPIC, numPartitions: 6, replicationFactor: 1 },
  { topic: KAFKA_PROFILES_TOPIC, numPartitions: 3, replicationFactor: 1 },
  { topic: KAFKA_GROUPS_TOPIC, numPartitions: 3, replicationFactor: 1 },
  { topic: KAFKA_IDENTITY_TOPIC, numPartitions: 3, replicationFactor: 1 },
  { topic: KAFKA_DLQ_TOPIC, numPartitions: 1, replicationFactor: 1 },
]

export async function ensureTopics(): Promise<void> {
  if (!kafkaEnabled) return

  const admin = kafka.admin()
  await admin.connect()

  try {
    const existing = await admin.listTopics()
    const toCreate = TOPICS.filter((t) => !existing.includes(t.topic))

    if (toCreate.length > 0) {
      await admin.createTopics({ topics: toCreate })
      logger.info(`Kafka topics created: ${toCreate.map((t) => t.topic).join(', ')}`)
    } else {
      logger.info('All Kafka topics already exist')
    }
  } finally {
    await admin.disconnect()
  }
}
