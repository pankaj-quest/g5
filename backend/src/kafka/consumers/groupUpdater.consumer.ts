import { Consumer } from 'kafkajs'
import { Types } from 'mongoose'
import { kafka } from '../client.js'
import { applyGroupOperation } from '../../services/ingest/group.service.js'
import { KAFKA_GROUPS_TOPIC, KAFKA_DLQ_TOPIC } from '../../config/constants.js'
import { sendToTopic } from '../producer.js'
import { logger } from '../../utils/logger.js'

let consumer: Consumer | null = null

export async function startGroupUpdaterConsumer(): Promise<void> {
  consumer = kafka.consumer({ groupId: 'g5-group-updater' })
  await consumer.connect()
  await consumer.subscribe({ topic: KAFKA_GROUPS_TOPIC, fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const raw = JSON.parse(message.value!.toString())
        const projectId = new Types.ObjectId(raw.projectId)
        const { projectId: _pid, ...payload } = raw
        await applyGroupOperation(projectId, payload)
      } catch (err) {
        logger.error('Failed to process group update from Kafka', { err })
        await sendToTopic(KAFKA_DLQ_TOPIC, [
          { key: message.key?.toString(), value: message.value!.toString() },
        ]).catch(() => null)
      }
    },
  })

  logger.info('Kafka group updater consumer started')
}

export async function stopGroupUpdaterConsumer(): Promise<void> {
  if (consumer) {
    await consumer.disconnect()
    consumer = null
  }
}
