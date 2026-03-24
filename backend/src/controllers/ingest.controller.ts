import { Request, Response } from 'express'
import { ingestEvent, ingestBatch, RawEvent } from '../services/ingest/event.service.js'
import { applyProfileOperation, EngagePayload } from '../services/ingest/profile.service.js'
import { applyGroupOperation, GroupPayload } from '../services/ingest/group.service.js'
import { BATCH_MAX_EVENTS } from '../config/constants.js'
import { pubsubEnabled } from '../pubsub/client.js'
import { publishEvent, publishEventBatch, publishProfileUpdate, publishGroupUpdate } from '../pubsub/publisher.js'

export async function track(req: Request, res: Response) {
  const projectId = req.projectId!
  const body = req.body

  const raw: RawEvent = {
    event: body.event || body.name,
    properties: body.properties || body,
  }

  if (!raw.event) {
    res.status(400).json({ error: 'event name is required' })
    return
  }

  if (pubsubEnabled) {
    // Publish to Pub/Sub — non-blocking, returns instantly
    publishEvent(projectId.toString(), { projectId: projectId.toString(), ...raw })
    res.json({ status: 1 })
  } else {
    // Direct MongoDB write (dev / fallback)
    await ingestEvent(projectId, raw)
    res.json({ status: 1 })
  }
}

export async function importBatch(req: Request, res: Response) {
  const projectId = req.projectId!
  const body = req.body

  if (!Array.isArray(body)) {
    res.status(400).json({ error: 'Expected array of events' })
    return
  }

  if (body.length > BATCH_MAX_EVENTS) {
    res.status(400).json({ error: `Max ${BATCH_MAX_EVENTS} events per batch` })
    return
  }

  const events: RawEvent[] = body.map((e) => ({
    event: e.event || e.name,
    properties: e.properties || e,
  }))

  const invalid = events.findIndex((e) => !e.event)
  if (invalid !== -1) {
    res.status(400).json({ error: `Event at index ${invalid} missing name` })
    return
  }

  if (pubsubEnabled) {
    // Publish all events to Pub/Sub — batching handled by client
    const payloads = events.map((raw) => ({ projectId: projectId.toString(), ...raw }))
    publishEventBatch(projectId.toString(), payloads)
    res.json({ status: 1, queued: events.length })
  } else {
    const result = await ingestBatch(projectId, events)
    res.json({ status: 1, ...result })
  }
}

export async function engage(req: Request, res: Response) {
  const projectId = req.projectId!
  const payload = req.body as EngagePayload

  if (!payload.$distinct_id) {
    res.status(400).json({ error: '$distinct_id is required' })
    return
  }

  if (pubsubEnabled) {
    publishProfileUpdate(projectId.toString(), { projectId: projectId.toString(), ...payload })
  } else {
    await applyProfileOperation(projectId, payload)
  }

  res.json({ status: 1 })
}

export async function groups(req: Request, res: Response) {
  const projectId = req.projectId!
  const payload = req.body as GroupPayload

  if (!payload.$group_key || !payload.$group_id) {
    res.status(400).json({ error: '$group_key and $group_id are required' })
    return
  }

  if (pubsubEnabled) {
    publishGroupUpdate(projectId.toString(), { projectId: projectId.toString(), ...payload })
  } else {
    await applyGroupOperation(projectId, payload)
  }

  res.json({ status: 1 })
}
