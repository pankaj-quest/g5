import { Types } from 'mongoose'
import { Event } from '../../models/Event.model.js'
import { cacheQuery } from '../cache/cache.service.js'
import { CACHE_TTL_RETENTION } from '../../config/constants.js'

export interface RetentionQuery {
  projectId: Types.ObjectId
  birthEvent: string
  returnEvent: string
  from: Date
  to: Date
  unit: 'day' | 'week' | 'month'
}

export async function runRetention(query: RetentionQuery) {
  return cacheQuery(
    `retention:${query.projectId}`,
    { ...query, projectId: query.projectId.toString() },
    CACHE_TTL_RETENTION,
    () => _runRetention(query)
  )
}

async function _runRetention(query: RetentionQuery) {
  const pipeline = [
    // Find users who did the birth event in the window
    {
      $match: {
        projectId: query.projectId,
        event: query.birthEvent,
        time: { $gte: query.from, $lte: query.to },
      },
    },
    {
      $group: {
        _id: {
          distinctId: '$distinctId',
          cohortPeriod: { $dateTrunc: { date: '$time', unit: query.unit } },
        },
      },
    },
    // Lookup their return events
    {
      $lookup: {
        from: 'events',
        let: { uid: '$_id.distinctId', cohortTime: '$_id.cohortPeriod' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$projectId', query.projectId] },
                  { $eq: ['$distinctId', '$$uid'] },
                  { $eq: ['$event', query.returnEvent] },
                  { $gte: ['$time', '$$cohortTime'] },
                ],
              },
            },
          },
          {
            $project: {
              periodOffset: {
                $dateDiff: {
                  startDate: '$$cohortTime',
                  endDate: '$time',
                  unit: query.unit,
                },
              },
            },
          },
        ],
        as: 'returnEvents',
      },
    },
    { $unwind: '$returnEvents' },
    {
      $group: {
        _id: {
          cohortPeriod: '$_id.cohortPeriod',
          periodOffset: '$returnEvents.periodOffset',
        },
        retainedUsers: { $addToSet: '$_id.distinctId' },
      },
    },
    { $addFields: { retainedCount: { $size: '$retainedUsers' } } },
    { $project: { retainedUsers: 0 } },
    { $sort: { '_id.cohortPeriod': 1, '_id.periodOffset': 1 } },
  ]

  return Event.aggregate(pipeline)
}
