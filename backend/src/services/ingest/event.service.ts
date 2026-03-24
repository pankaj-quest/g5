import { Types } from 'mongoose'
import { Event } from '../../models/Event.model.js'
import { resolveGeo } from '../../utils/geoip.js'
import { parseDevice } from '../../utils/deviceParser.js'
import { fromUnixTimestamp } from '../../utils/timeUtils.js'
import { deduplicateAndInsert } from './dedup.service.js'
import { broadcastEvent } from '../realtime/broadcast.service.js'
import { updateProfileLastSeen } from './profile.service.js'
import { resolveIdentity } from './identity.service.js'

export interface RawEvent {
  event: string
  properties: Record<string, unknown>
}

export async function ingestEvent(projectId: Types.ObjectId, raw: RawEvent): Promise<boolean> {
  const props = raw.properties || {}

  const rawDistinctId = String(props.distinct_id || props['$distinct_id'] || 'anonymous')
  const insertId = props['$insert_id'] ? String(props['$insert_id']).slice(0, 36) : undefined
  const ip = props['$ip'] ? String(props['$ip']) : undefined
  const userAgent = props['$user_agent'] ? String(props['$user_agent']) : undefined
  const rawTime = props.time ?? props['$time']
  const time = rawTime ? fromUnixTimestamp(Number(rawTime)) : new Date()

  // Resolve identity (device → user merge)
  const distinctId = await resolveIdentity(projectId, rawDistinctId, props)

  // Strip system properties from stored properties
  const cleanProps = { ...props }
  for (const key of ['token', '$ip', '$insert_id', 'distinct_id', '$distinct_id', 'time', '$time', '$user_agent']) {
    delete cleanProps[key]
  }

  const geo = resolveGeo(ip)
  const device = parseDevice(userAgent)

  const eventDoc = {
    projectId,
    event: raw.event,
    distinctId,
    originalDistinctId: rawDistinctId,
    insertId,
    time,
    receivedAt: new Date(),
    properties: cleanProps,
    geo,
    device,
  }

  const inserted = await deduplicateAndInsert(projectId, eventDoc, insertId)

  if (inserted) {
    // Fire-and-forget: update profile + broadcast
    updateProfileLastSeen(projectId, distinctId).catch(() => null)
    broadcastEvent(projectId.toString(), {
      event: raw.event,
      distinctId,
      time: time.toISOString(),
      properties: cleanProps,
    }).catch(() => null)
  }

  return inserted
}

export async function ingestBatch(
  projectId: Types.ObjectId,
  events: RawEvent[]
): Promise<{ inserted: number; duplicates: number }> {
  const { filterDuplicateBatch } = await import('./dedup.service.js')

  const insertIds = events.map((e) => {
    const id = e.properties?.['$insert_id']
    return id ? String(id).slice(0, 36) : undefined
  })

  const duplicateSet = await filterDuplicateBatch(projectId, insertIds)

  const toInsert = events.filter((_, i) => {
    const id = insertIds[i]
    return !id || !duplicateSet.has(id)
  })

  if (toInsert.length === 0) return { inserted: 0, duplicates: events.length }

  // Process each event through full enrichment pipeline
  const docs = await Promise.all(
    toInsert.map(async (raw) => {
      const props = raw.properties || {}
      const rawDistinctId = String(props.distinct_id || props['$distinct_id'] || 'anonymous')
      const insertId = props['$insert_id'] ? String(props['$insert_id']).slice(0, 36) : undefined
      const ip = props['$ip'] ? String(props['$ip']) : undefined
      const userAgent = props['$user_agent'] ? String(props['$user_agent']) : undefined
      const rawTime = props.time ?? props['$time']
      const time = rawTime ? fromUnixTimestamp(Number(rawTime)) : new Date()
      const distinctId = await resolveIdentity(projectId, rawDistinctId, props)

      const cleanProps = { ...props }
      for (const key of ['token', '$ip', '$insert_id', 'distinct_id', '$distinct_id', 'time', '$time', '$user_agent']) {
        delete cleanProps[key]
      }

      return {
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
      }
    })
  )

  await Event.insertMany(docs, { ordered: false })

  return { inserted: toInsert.length, duplicates: events.length - toInsert.length }
}
