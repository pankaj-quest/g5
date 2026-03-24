import { Types } from 'mongoose'
import { Event } from '../../models/Event.model.js'
import { cacheQuery } from '../cache/cache.service.js'
import { CACHE_TTL_INSIGHTS } from '../../config/constants.js'

export interface InsightsQuery {
  projectId: Types.ObjectId
  eventName: string
  metric: 'total' | 'unique'
  from: Date
  to: Date
  unit: 'hour' | 'day' | 'week' | 'month'
  breakdown?: string // property name for breakdown
  filters?: Array<{ property: string; op: 'eq' | 'neq' | 'contains'; value: unknown }>
}

export async function runInsights(query: InsightsQuery) {
  return cacheQuery(
    `insights:${query.projectId}`,
    { ...query, projectId: query.projectId.toString() },
    CACHE_TTL_INSIGHTS,
    () => _runInsights(query)
  )
}

async function _runInsights(query: InsightsQuery) {
  const matchStage: Record<string, unknown> = {
    projectId: query.projectId,
    event: query.eventName,
    time: { $gte: query.from, $lte: query.to },
  }

  if (query.filters) {
    for (const f of query.filters) {
      const key = `properties.${f.property}`
      if (f.op === 'eq') matchStage[key] = f.value
      else if (f.op === 'neq') matchStage[key] = { $ne: f.value }
      else if (f.op === 'contains') matchStage[key] = { $regex: f.value, $options: 'i' }
    }
  }

  const groupId: Record<string, unknown> = {
    date: { $dateTrunc: { date: '$time', unit: query.unit } },
  }
  if (query.breakdown) {
    groupId.breakdown = `$properties.${query.breakdown}`
  }

  const groupStage: Record<string, unknown> = {
    _id: groupId,
    total: { $sum: 1 },
  }
  if (query.metric === 'unique') {
    groupStage.users = { $addToSet: '$distinctId' }
  }

  const pipeline: object[] = [
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { '_id.date': 1 } },
  ]

  if (query.metric === 'unique') {
    pipeline.push({ $addFields: { count: { $size: '$users' } } })
    pipeline.push({ $project: { users: 0 } })
  } else {
    pipeline.push({ $addFields: { count: '$total' } })
  }

  return Event.aggregate(pipeline)
}
