import { Consumer } from 'kafkajs'
import { Types } from 'mongoose'
import { kafka } from '../client.js'
import { KAFKA_IDENTITY_TOPIC, KAFKA_DLQ_TOPIC } from '../../config/constants.js'
import { sendToTopic } from '../producer.js'
import { logger } from '../../utils/logger.js'

let consumer: Consumer | null = null

export async function startIdentityMergeConsumer(): Promise<void> {
  consumer = kafka.consumer({ groupId: 'g5-identity-merge' })
  await consumer.connect()
  await consumer.subscribe({ topic: KAFKA_IDENTITY_TOPIC, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const { Event } = await import('../../models/Event.model.js')
        const { UserProfile } = await import('../../models/UserProfile.model.js')

        const { projectId, deviceId, userId } = JSON.parse(message.value!.toString())
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

        // Retroactive event reattribution
        await Event.updateMany(
          { projectId: pid, originalDistinctId: deviceId },
          { $set: { distinctId: userId } }
        )

        logger.debug(`Identity merge: ${deviceId} → ${userId}`)
      } catch (err) {
        logger.error('Failed to process identity merge from Kafka', { err })
        await sendToTopic(KAFKA_DLQ_TOPIC, [
          { key: message.key?.toString(), value: message.value!.toString() },
        ]).catch(() => null)
      }
    },
  })

  logger.info('Kafka identity merge consumer started')
}

export async function stopIdentityMergeConsumer(): Promise<void> {
  if (consumer) {
    await consumer.disconnect()
    consumer = null
  }
}
