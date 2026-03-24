import { Request, Response } from 'express'
import { runInsights } from '../services/analytics/insights.service.js'
import { runFunnel } from '../services/analytics/funnel.service.js'
import { runRetention } from '../services/analytics/retention.service.js'
import { runFlows } from '../services/analytics/flows.service.js'
import { computeCohortMembers, saveCohort } from '../services/analytics/cohort.service.js'
import { Event } from '../models/Event.model.js'

function parseFrom(v: unknown): Date {
  return v ? new Date(v as string) : new Date(Date.now() - 90 * 86400000)
}

function parseTo(v: unknown): Date {
  return v ? new Date(v as string) : new Date()
}

export async function getAvailableEvents(req: Request, res: Response) {
  const projectId = req.projectId!
  const events = await Event.distinct('event', { projectId })
  res.json(events.sort())
}

export async function getProjectStats(req: Request, res: Response) {
  const projectId = req.projectId!
  const { UserProfile } = await import('../models/UserProfile.model.js')

  const totalEvents = await Event.countDocuments({ projectId })
  const totalUsers = await Event.distinct('distinctId', { projectId }).then(arr => arr.length)
  const totalProfiles = await UserProfile.countDocuments({ projectId })

  // Events today
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const eventsToday = await Event.countDocuments({
    projectId,
    time: { $gte: startOfToday }
  })

  res.json({ totalEvents, totalUsers, totalProfiles, eventsToday })
}

export async function getRecentEvents(req: Request, res: Response) {
  const projectId = req.projectId!
  const limit = Number(req.query.limit) || 100

  const events = await Event.find({ projectId })
    .sort({ time: -1 })
    .limit(limit)
    .lean()

  res.json(events)
}

export async function insights(req: Request, res: Response) {
  const projectId = req.projectId!
  const { eventName, metric, from, to, unit, breakdown, filters } = req.query

  const result = await runInsights({
    projectId,
    eventName: String(eventName),
    metric: (metric as 'total' | 'unique') || 'total',
    from: parseFrom(from),
    to: parseTo(to),
    unit: (unit as 'hour' | 'day' | 'week' | 'month') || 'day',
    breakdown: breakdown ? String(breakdown) : undefined,
    filters: filters ? JSON.parse(String(filters)) : undefined,
  })

  res.json(result)
}

export async function funnels(req: Request, res: Response) {
  const projectId = req.projectId!
  const { steps, from, to, conversionWindowSeconds, breakdown } = req.body

  if (!steps || !Array.isArray(steps) || steps.length < 2) {
    res.status(400).json({ error: 'steps array with at least 2 events required' })
    return
  }

  const result = await runFunnel({
    projectId,
    steps,
    from: parseFrom(from),
    to: parseTo(to),
    conversionWindowSeconds: Number(conversionWindowSeconds) || 86400,
    breakdown: breakdown ? String(breakdown) : undefined,
  })

  res.json(result)
}

export async function retention(req: Request, res: Response) {
  const projectId = req.projectId!
  const { birthEvent, returnEvent, from, to, unit } = req.query

  const result = await runRetention({
    projectId,
    birthEvent: String(birthEvent),
    returnEvent: String(returnEvent),
    from: parseFrom(from),
    to: parseTo(to),
    unit: (unit as 'day' | 'week' | 'month') || 'week',
  })

  res.json(result)
}

export async function flows(req: Request, res: Response) {
  const projectId = req.projectId!
  const { startEvent, from, to, maxDepth, minUsers } = req.query

  const result = await runFlows({
    projectId,
    from: parseFrom(from),
    to: parseTo(to),
    startEvent: startEvent ? String(startEvent) : undefined,
    maxDepth: Number(maxDepth) || 5,
    minUsers: Number(minUsers) || 2,
  })

  res.json(result)
}

export async function cohorts(req: Request, res: Response) {
  const projectId = req.projectId!

  if (req.method === 'POST') {
    const { name, config } = req.body
    const cohort = await saveCohort(projectId, req.userId!, name, config)
    const members = await computeCohortMembers(projectId, config)
    res.status(201).json({ cohort, memberCount: members.length })
    return
  }

  const config = JSON.parse(String(req.query.config || '{}'))
  const members = await computeCohortMembers(projectId, config)
  res.json({ members, count: members.length })
}

export async function exportEvents(req: Request, res: Response) {
  const projectId = req.projectId!
  const { from, to, event: eventName } = req.query

  const matchStage: Record<string, unknown> = {
    projectId,
    time: { $gte: parseFrom(from), $lte: parseTo(to) },
  }
  if (eventName) matchStage.event = String(eventName)

  res.setHeader('Content-Type', 'application/x-ndjson')
  res.setHeader('Transfer-Encoding', 'chunked')

  const cursor = Event.find(matchStage).lean().cursor()
  for await (const doc of cursor) {
    res.write(JSON.stringify(doc) + '\n')
  }
  res.end()
}
