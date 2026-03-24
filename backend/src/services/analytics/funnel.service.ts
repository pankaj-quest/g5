import { Types } from 'mongoose'
import { Event } from '../../models/Event.model.js'
import { cacheQuery } from '../cache/cache.service.js'
import { CACHE_TTL_FUNNELS } from '../../config/constants.js'

export interface FunnelQuery {
  projectId: Types.ObjectId
  steps: string[] // event names in order
  from: Date
  to: Date
  conversionWindowSeconds: number // e.g. 86400 = 1 day
  breakdown?: string
}

const funnelStepFn = `
function(events, steps, windowMs) {
  var stepIndex = 0;
  var stepStartTime = null;
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (e.event === steps[stepIndex]) {
      if (stepIndex === 0) {
        stepStartTime = e.time.getTime();
        stepIndex++;
      } else if ((e.time.getTime() - stepStartTime) <= windowMs) {
        stepIndex++;
      }
      if (stepIndex === steps.length) break;
    }
  }
  return stepIndex;
}
`

export async function runFunnel(query: FunnelQuery) {
  return cacheQuery(
    `funnels:${query.projectId}`,
    { ...query, projectId: query.projectId.toString() },
    CACHE_TTL_FUNNELS,
    () => _runFunnel(query)
  )
}

async function _runFunnel(query: FunnelQuery) {
  const windowMs = query.conversionWindowSeconds * 1000

  const groupAcc: Record<string, unknown> = {}
  for (let i = 0; i < query.steps.length; i++) {
    groupAcc[`step${i + 1}`] = {
      $sum: {
        $cond: [{ $gte: ['$completedSteps', i + 1] }, 1, 0],
      },
    }
  }

  const pipeline = [
    {
      $match: {
        projectId: query.projectId,
        event: { $in: query.steps },
        time: { $gte: query.from, $lte: query.to },
      },
    },
    {
      $group: {
        _id: '$distinctId',
        events: { $push: { event: '$event', time: '$time' } },
      },
    },
    {
      $addFields: {
        events: { $sortArray: { input: '$events', sortBy: { time: 1 } } },
      },
    },
    {
      $addFields: {
        completedSteps: {
          $function: {
            body: funnelStepFn,
            args: ['$events', query.steps, windowMs],
            lang: 'js',
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        ...groupAcc,
        total: { $sum: 1 },
      },
    },
  ]

  const result = await Event.aggregate(pipeline)
  return result[0] || Object.fromEntries(query.steps.map((_, i) => [`step${i + 1}`, 0]))
}
