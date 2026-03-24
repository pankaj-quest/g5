import { pubsubEnabled } from './client.js'
import { ensurePubSubTopics } from './setup.js'
import { startEventWriterConsumer, stopEventWriterConsumer } from './consumers/eventWriter.consumer.js'
import { startRealtimeFanConsumer } from './consumers/realtimeFan.consumer.js'
import { startProfileUpdaterConsumer } from './consumers/profileUpdater.consumer.js'
import { startGroupUpdaterConsumer } from './consumers/groupUpdater.consumer.js'
import { startIdentityMergeConsumer } from './consumers/identityMerge.consumer.js'
import { logger } from '../utils/logger.js'

export async function initPubSub(): Promise<void> {
  if (!pubsubEnabled) {
    logger.info('Pub/Sub disabled — using direct MongoDB writes')
    return
  }

  logger.info('Initializing Pub/Sub...')

  await ensurePubSubTopics()

  // Start all consumers
  startEventWriterConsumer()
  startRealtimeFanConsumer()
  startProfileUpdaterConsumer()
  startGroupUpdaterConsumer()
  startIdentityMergeConsumer()

  logger.info('Pub/Sub initialized — publisher + 5 consumers running')
}

export async function shutdownPubSub(): Promise<void> {
  if (!pubsubEnabled) return

  logger.info('Shutting down Pub/Sub consumers...')
  stopEventWriterConsumer()
  logger.info('Pub/Sub shutdown complete')
}
