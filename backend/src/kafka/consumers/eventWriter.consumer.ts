import { Consumer, EachBatchPayload } from 'kafkajs'
import { Types } from 'mongoose'
import { kafka } from '../client.js'
import { Event } from '../../models/Event.model.js'
import { resolveGeo } from '../../utils/geoip.js'
import { parseDevice } from '../../utils/deviceParser.js'
import { fromUnixTimestamp } from '../../utils/timeUtils.js'
import { resolveIdentity } from '../../services/ingest/identity.service.js'
import { updateProfileLastSeen } from '../../services/ingest/profile.service.js'
import { broadcastEvent } from '../../services/realtime/broadcast.service.js'
import { KAFKA_EVENTS_TOPIC, KAFKA_DLQ_TOPIC } from '../../config/constants.js'
import { sendToTopic } from '../producer.js'
import { logger } from '../../utils/logger.js'

let consumer: Consumer | null = null

export async function startEventWriterConsumer(): Promise<void> {
  consumer = kafka.consumer({ groupId: 'g5-event-writer' })
  await consumer.connect()
  await consumer.subscribe({ topic: KAFKA_EVENTS_TOPIC, fromBeginning: false })

  await consumer.run({
    eachBatchAutoResolve: true,
    eachBatch: async ({ batch, resolveOffset, heartbeat }: EachBatchPayload) => {
      const docs = []

      for (const message of batch.messages) {
        try {
          const raw = JSON.parse(message.value!.toString())
          const projectId = new Types.ObjectId(raw.projectId)
          const props = raw.properties || {}

          const rawDistinctId = String(props.distinct_id || props['$distinct_id'] || 'anonymous')
          const insertId = props['$insert_id'] ? String(props['$insert_id']).slice(0, 36) : undefined
          const ip = props['$ip'] ? String(props['$ip']) : undefined
          const userAgent = props['$user_agent'] ? String(props['$user_agent']) : undefined
          const rawTime = props.time ?? props['$time']
          const time = rawTime ? fromUnixTimestamp(Number(rawTime)) : new Date()

          const distinctId = await resolveIdentity(projectId, rawDistinctId, props)

          // Strip system properties
          const cleanProps = { ...props }
          for (const key of ['token', '$ip', '$insert_id', 'distinct_id', '$distinct_id', 'time', '$time', '$user_agent']) {
            delete cleanProps[key]
          }

          docs.push({
            projectId,
            event: raw.event,
            distinctId,
            originalDistinctId: rawDistinctId,
            insertId,
            time,
            receivedAt: new Date(),
            properties: cleanProps,
            geo: resolveGeo(ip),
            device: parseDevice(userAgent),
          })

          // Fire-and-forget: update profile + broadcast
          updateProfileLastSeen(projectId, distinctId).catch(() => null)
          broadcastEvent(projectId.toString(), {
            event: raw.event,
            distinctId,
            time: time.toISOString(),
            properties: cleanProps,
          }).catch(() => null)

          resolveOffset(message.offset)
        } catch (err) {
          logger.error('Failed to process event from Kafka', { err, offset: message.offset })
          // Send to DLQ
          await sendToTopic(KAFKA_DLQ_TOPIC, [
            {
              key: message.key?.toString(),
              value: message.value!.toString(),
            },
          ]).catch(() => null)
          resolveOffset(message.offset)
        }

        await heartbeat()
      }

      // Batch insert to MongoDB
      if (docs.length > 0) {
        try {
          await Event.insertMany(docs, { ordered: false })
          logger.debug(`Event writer: inserted ${docs.length} events`)
        } catch (err) {
          // insertMany with ordered:false continues on duplicate key errors
          logger.warn('Batch insert partially failed (likely duplicates)', { err })
        }
      }
    },
  })

  logger.info('Kafka event writer consumer started')
}

export async function stopEventWriterConsumer(): Promise<void> {
  if (consumer) {
    await consumer.disconnect()
    consumer = null
  }
}
