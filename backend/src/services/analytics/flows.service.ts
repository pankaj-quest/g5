import { Types } from 'mongoose'
import { Event } from '../../models/Event.model.js'
import { cacheQuery } from '../cache/cache.service.js'
import { CACHE_TTL_FLOWS } from '../../config/constants.js'

export interface FlowsQuery {
  projectId: Types.ObjectId
  from: Date
  to: Date
  startEvent?: string
  maxDepth: number // how many steps to trace
  minUsers: number // minimum users on a path to include
}

export async function runFlows(query: FlowsQuery) {
  return cacheQuery(
    `flows:${query.projectId}`,
    { ...query, projectId: query.projectId.toString() },
    CACHE_TTL_FLOWS,
    () => _runFlows(query)
  )
}

async function _runFlows(query: FlowsQuery) {
  const matchStage: Record<string, unknown> = {
    projectId: query.projectId,
    time: { $gte: query.from, $lte: query.to },
  }
  if (query.startEvent) matchStage.event = query.startEvent

  const pipeline = [
    { $match: matchStage },
    { $sort: { distinctId: 1 as const, time: 1 as const } },
    {
      $group: {
        _id: '$distinctId',
        path: { $push: '$event' },
      },
    },
    {
      $addFields: {
        path: { $slice: ['$path', query.maxDepth] },
      },
    },
    {
      $group: {
        _id: '$path',
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gte: query.minUsers } } },
    { $sort: { count: -1 as const } },
    { $limit: 100 },
  ]

  return Event.aggregate(pipeline as any)
}
