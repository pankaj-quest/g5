import { Types } from 'mongoose'
import { Event } from '../../models/Event.model.js'
import { UserProfile } from '../../models/UserProfile.model.js'
import { SavedQuery } from '../../models/SavedQuery.model.js'
import { cacheQuery } from '../cache/cache.service.js'
import { CACHE_TTL_COHORTS } from '../../config/constants.js'

export interface CohortConfig {
  type: 'behavioral' | 'property'
  // behavioral: users who did X event at least N times
  event?: string
  minCount?: number
  windowDays?: number
  // property: users where property = value
  property?: string
  value?: unknown
}

export async function computeCohortMembers(
  projectId: Types.ObjectId,
  config: CohortConfig
): Promise<string[]> {
  return cacheQuery(
    `cohorts:${projectId}`,
    { projectId: projectId.toString(), ...config },
    CACHE_TTL_COHORTS,
    () => _computeCohortMembers(projectId, config)
  )
}

async function _computeCohortMembers(
  projectId: Types.ObjectId,
  config: CohortConfig
): Promise<string[]> {
  if (config.type === 'behavioral') {
    const from = new Date()
    from.setDate(from.getDate() - (config.windowDays || 30))

    const results = await Event.aggregate([
      {
        $match: {
          projectId,
          event: config.event,
          time: { $gte: from },
        },
      },
      { $group: { _id: '$distinctId', count: { $sum: 1 } } },
      { $match: { count: { $gte: config.minCount || 1 } } },
    ])

    return results.map((r) => r._id)
  }

  if (config.type === 'property') {
    const profiles = await UserProfile.find({
      projectId,
      [`properties.${config.property}`]: config.value,
    })
      .select('distinctId')
      .lean()

    return profiles.map((p) => p.distinctId)
  }

  return []
}

export async function saveCohort(
  projectId: Types.ObjectId,
  createdBy: Types.ObjectId,
  name: string,
  config: CohortConfig
) {
  return SavedQuery.create({
    projectId,
    type: 'cohort',
    name,
    config,
    createdBy,
  })
}
