import { Consumer } from 'kafkajs'
import { Types } from 'mongoose'
import { kafka } from '../client.js'
import { applyProfileOperation } from '../../services/ingest/profile.service.js'
import { KAFKA_PROFILES_TOPIC, KAFKA_DLQ_TOPIC } from '../../config/constants.js'
import { sendToTopic } from '../producer.js'
import { logger } from '../../utils/logger.js'

let consumer: Consumer | null = null

export async function startProfileUpdaterConsumer(): Promise<void> {
  consumer = kafka.consumer({ groupId: 'g5-profile-updater' })
  await consumer.connect()
  await consumer.subscribe({ topic: KAFKA_PROFILES_TOPIC, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const raw = JSON.parse(message.value!.toString())
        const projectId = new Types.ObjectId(raw.projectId)

        // Remove our wrapper field before passing to profile service
        const { projectId: _pid, ...payload } = raw
        await applyProfileOperation(projectId, payload)
      } catch (err) {
        logger.error('Failed to process profile update from Kafka', { err })
        await sendToTopic(KAFKA_DLQ_TOPIC, [
          { key: message.key?.toString(), value: message.value!.toString() },
        ]).catch(() => null)
      }
    },
  })

  logger.info('Kafka profile updater consumer started')
}

export async function stopProfileUpdaterConsumer(): Promise<void> {
  if (consumer) {
    await consumer.disconnect()
    consumer = null
  }
}
