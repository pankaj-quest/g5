import { kafkaEnabled } from './client.js'
import { connectProducer, disconnectProducer } from './producer.js'
import { ensureTopics } from './topics.js'
import { startEventWriterConsumer, stopEventWriterConsumer } from './consumers/eventWriter.consumer.js'
import { startProfileUpdaterConsumer, stopProfileUpdaterConsumer } from './consumers/profileUpdater.consumer.js'
import { startGroupUpdaterConsumer, stopGroupUpdaterConsumer } from './consumers/groupUpdater.consumer.js'
import { startIdentityMergeConsumer, stopIdentityMergeConsumer } from './consumers/identityMerge.consumer.js'
import { logger } from '../utils/logger.js'

export async function initKafka(): Promise<void> {
  if (!kafkaEnabled) {
    logger.info('Kafka is disabled — using direct MongoDB writes')
    return
  }

  logger.info('Initializing Kafka...')

  // Create topics if they don't exist
  await ensureTopics()

  // Connect producer (used by API endpoints)
  await connectProducer()

  // Start all consumers
  await Promise.all([
    startEventWriterConsumer(),
    startProfileUpdaterConsumer(),
    startGroupUpdaterConsumer(),
    startIdentityMergeConsumer(),
  ])

  logger.info('Kafka fully initialized — producer + 4 consumers running')
}

export async function shutdownKafka(): Promise<void> {
  if (!kafkaEnabled) return

  logger.info('Shutting down Kafka...')

  await Promise.allSettled([
    stopEventWriterConsumer(),
    stopProfileUpdaterConsumer(),
    stopGroupUpdaterConsumer(),
    stopIdentityMergeConsumer(),
    disconnectProducer(),
  ])

  logger.info('Kafka shutdown complete')
}
