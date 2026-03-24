import { Types } from 'mongoose'
import { pubsub, SUB_GROUP_UPDATER } from '../client.js'
import { applyGroupOperation } from '../../services/ingest/group.service.js'
import { publishToDLQ } from '../publisher.js'
import { logger } from '../../utils/logger.js'
import type { Message } from '@google-cloud/pubsub'

export function startGroupUpdaterConsumer(): void {
  const subscription = pubsub.subscription(SUB_GROUP_UPDATER, {
    flowControl: { maxMessages: 200, allowExcessMessages: false },
  })

  subscription.on('message', async (message: Message) => {
    try {
      const raw = JSON.parse(message.data.toString())
      const projectId = new Types.ObjectId(raw.projectId)
      const { projectId: _pid, ...payload } = raw
      await applyGroupOperation(projectId, payload)
      message.ack()
    } catch (err) {
      logger.error('Group updater: failed', { err })
      await publishToDLQ(message.data.toString(), String(err)).catch(() => null)
      message.ack()
    }
  })

  subscription.on('error', (err) => {
    logger.error('Group updater subscription error', { err })
  })

  logger.info('Group updater consumer started')
}
