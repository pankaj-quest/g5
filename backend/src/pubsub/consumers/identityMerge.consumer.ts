import { Types } from 'mongoose'
import { pubsub, SUB_IDENTITY_MERGE } from '../client.js'
import { publishToDLQ } from '../publisher.js'
import { logger } from '../../utils/logger.js'
import type { Message } from '@google-cloud/pubsub'

export function startIdentityMergeConsumer(): void {
  const subscription = pubsub.subscription(SUB_IDENTITY_MERGE, {
    flowControl: { maxMessages: 100, allowExcessMessages: false },
  })

  subscription.on('message', async (message: Message) => {
    try {
      const { Event } = await import('../../models/Event.model.js')
      const { UserProfile } = await import('../../models/UserProfile.model.js')

      const { projectId, deviceId, userId } = JSON.parse(message.data.toString())
      const pid = new Types.ObjectId(projectId)

      const [deviceProfile, userProfile] = await Promise.all([
        UserProfile.findOne({ projectId: pid, distinctId: deviceId }),
        UserProfile.findOne({ projectId: pid, distinctId: userId }),
      ])

      if (userProfile) {
        if (deviceProfile) {
          await UserProfile.updateOne(
            { _id: userProfile._id },
            { $addToSet: { deviceIds: deviceId, aliases: deviceId } }
          )
          await UserProfile.deleteOne({ _id: deviceProfile._id })
        } else {
          await UserProfile.updateOne(
            { _id: userProfile._id },
            { $addToSet: { deviceIds: deviceId } }
          )
        }
      } else if (deviceProfile) {
        await UserProfile.updateOne(
          { _id: deviceProfile._id },
          {
            $set: { distinctId: userId },
            $addToSet: { deviceIds: deviceId, aliases: deviceId },
          }
        )
      }

      // Retroactive reattribution
      await Event.updateMany(
        { projectId: pid, originalDistinctId: deviceId },
        { $set: { distinctId: userId } }
      )

      message.ack()
      logger.debug(`Identity merge: ${deviceId} → ${userId}`)
    } catch (err) {
      logger.error('Identity merge: failed', { err })
      await publishToDLQ(message.data.toString(), String(err)).catch(() => null)
      message.ack()
    }
  })

  subscription.on('error', (err) => {
    logger.error('Identity merge subscription error', { err })
  })

  logger.info('Identity merge consumer started')
}
