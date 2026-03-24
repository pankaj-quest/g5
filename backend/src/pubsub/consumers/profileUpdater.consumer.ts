import { Types } from 'mongoose'
import { pubsub, SUB_PROFILE_UPDATER } from '../client.js'
import { applyProfileOperation } from '../../services/ingest/profile.service.js'
import { publishToDLQ } from '../publisher.js'
import { logger } from '../../utils/logger.js'
import type { Message } from '@google-cloud/pubsub'

export function startProfileUpdaterConsumer(): void {
  const subscription = pubsub.subscription(SUB_PROFILE_UPDATER, {
    flowControl: { maxMessages: 200, allowExcessMessages: false },
  })

  subscription.on('message', async (message: Message) => {
    try {
      const raw = JSON.parse(message.data.toString())
      const projectId = new Types.ObjectId(raw.projectId)
      const { projectId: _pid, ...payload } = raw
      await applyProfileOperation(projectId, payload)
      message.ack()
    } catch (err) {
      logger.error('Profile updater: failed', { err })
      await publishToDLQ(message.data.toString(), String(err)).catch(() => null)
      message.ack()
    }
  })

  subscription.on('error', (err) => {
    logger.error('Profile updater subscription error', { err })
  })

  logger.info('Profile updater consumer started')
}
