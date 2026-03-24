import { Types } from 'mongoose'
import { pubsub, SUB_EVENT_WRITER } from '../client.js'
import { Event } from '../../models/Event.model.js'
import { resolveGeo } from '../../utils/geoip.js'
import { parseDevice } from '../../utils/deviceParser.js'
import { fromUnixTimestamp } from '../../utils/timeUtils.js'
import { publishToDLQ } from '../publisher.js'
import { logger } from '../../utils/logger.js'
import type { Message } from '@google-cloud/pubsub'

const BATCH_SIZE = 500
const FLUSH_INTERVAL_MS = 2000

let buffer: Record<string, unknown>[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

async function flushBuffer(): Promise<void> {
  if (buffer.length === 0) return

  const batch = buffer.splice(0, BATCH_SIZE)

  try {
    await Event.insertMany(batch, { ordered: false })
    logger.debug(`Event writer: flushed ${batch.length} events to MongoDB`)
  } catch (err: any) {
    // ordered:false means it continues past duplicate key errors
    if (err.code === 11000) {
      const inserted = batch.length - (err.writeErrors?.length || 0)
      logger.debug(`Event writer: flushed ${inserted} events (${err.writeErrors?.length || 0} duplicates)`)
    } else {
      logger.error('Event writer: batch insert failed', { err })
      // Re-queue failed events to DLQ
      for (const doc of batch) {
        await publishToDLQ(JSON.stringify(doc), String(err)).catch(() => null)
      }
    }
  }
}

function enrichEvent(raw: Record<string, unknown>): Record<string, unknown> {
  const props = (raw.properties || {}) as Record<string, unknown>

  const rawDistinctId = String(props.distinct_id || props['$distinct_id'] || 'anonymous')
  const insertId = props['$insert_id'] ? String(props['$insert_id']).slice(0, 36) : undefined
  const ip = props['$ip'] ? String(props['$ip']) : undefined
  const userAgent = props['$user_agent'] ? String(props['$user_agent']) : undefined
  const rawTime = props.time ?? props['$time']
  const time = rawTime ? fromUnixTimestamp(Number(rawTime)) : new Date()

  // Strip system properties
  const cleanProps = { ...props }
  for (const key of ['token', '$ip', '$insert_id', 'distinct_id', '$distinct_id', 'time', '$time', '$user_agent']) {
    delete cleanProps[key]
  }

  return {
    projectId: new Types.ObjectId(raw.projectId as string),
    event: raw.event,
    distinctId: rawDistinctId,
    originalDistinctId: rawDistinctId,
    insertId,
    time,
    receivedAt: new Date(),
    properties: cleanProps,
    geo: resolveGeo(ip),
    device: parseDevice(userAgent),
  }
}

export function startEventWriterConsumer(): void {
  const subscription = pubsub.subscription(SUB_EVENT_WRITER, {
    flowControl: {
      maxMessages: 1000,       // pull up to 1000 messages at a time
      allowExcessMessages: false,
    },
    streamingOptions: {
      maxStreams: 4,           // parallel pull streams
    },
  })

  subscription.on('message', (message: Message) => {
    try {
      const raw = JSON.parse(message.data.toString())
      const doc = enrichEvent(raw)
      buffer.push(doc)

      // Ack immediately — event is in our buffer, will be written to MongoDB
      message.ack()

      // Flush if buffer is full
      if (buffer.length >= BATCH_SIZE) {
        flushBuffer()
      }
    } catch (err) {
      logger.error('Event writer: failed to parse message', { err })
      publishToDLQ(message.data.toString(), String(err)).catch(() => null)
      message.ack() // ack to avoid infinite retry on bad data
    }
  })

  subscription.on('error', (err) => {
    logger.error('Event writer subscription error', { err })
  })

  // Periodic flush for low-traffic periods
  flushTimer = setInterval(() => flushBuffer(), FLUSH_INTERVAL_MS)

  logger.info(`Event writer consumer started (batch=${BATCH_SIZE}, flush=${FLUSH_INTERVAL_MS}ms)`)
}

export function stopEventWriterConsumer(): void {
  if (flushTimer) {
    clearInterval(flushTimer)
    flushTimer = null
  }
  // Final flush
  flushBuffer()
}
