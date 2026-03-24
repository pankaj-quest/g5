import { Types } from 'mongoose'
import { UserProfile } from '../../models/UserProfile.model.js'

export interface EngagePayload {
  $distinct_id: string
  $set?: Record<string, unknown>
  $set_once?: Record<string, unknown>
  $increment?: Record<string, number>
  $append?: Record<string, unknown>
  $union?: Record<string, unknown[]>
  $unset?: string | string[]
  $remove?: Record<string, unknown>
  $delete?: string
}

export async function applyProfileOperation(
  projectId: Types.ObjectId,
  payload: EngagePayload
): Promise<void> {
  const { $distinct_id } = payload

  // $delete — remove entire profile
  if ('$delete' in payload) {
    await UserProfile.deleteOne({ projectId, distinctId: $distinct_id })
    return
  }

  const updateOps: Record<string, unknown> = {}
  const arrayFilters: unknown[] = []

  if (payload.$set) {
    updateOps.$set = prefixProperties(payload.$set)
  }

  if (payload.$increment) {
    updateOps.$inc = prefixProperties(payload.$increment)
  }

  if (payload.$append) {
    updateOps.$push = prefixProperties(payload.$append)
  }

  if (payload.$union) {
    const each: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(payload.$union)) {
      each[`properties.${k}`] = { $each: Array.isArray(v) ? v : [v] }
    }
    updateOps.$addToSet = each
  }

  if (payload.$unset) {
    const keys = Array.isArray(payload.$unset) ? payload.$unset : [payload.$unset]
    const unsetObj: Record<string, ''> = {}
    for (const k of keys) unsetObj[`properties.${k}`] = ''
    updateOps.$unset = unsetObj
  }

  if (payload.$remove) {
    updateOps.$pull = prefixProperties(payload.$remove)
  }

  // $set_once: only set fields that don't already exist
  if (payload.$set_once) {
    const profile = await UserProfile.findOne({ projectId, distinctId: $distinct_id }).lean()
    const setOnceOps: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(payload.$set_once)) {
      if (!profile?.properties || !(profile.properties as unknown as Map<string, unknown>).has?.(k)) {
        setOnceOps[`properties.${k}`] = v
      }
    }
    if (Object.keys(setOnceOps).length > 0) {
      if (updateOps.$set) {
        Object.assign(updateOps.$set as Record<string, unknown>, setOnceOps)
      } else {
        updateOps.$set = setOnceOps
      }
    }
  }

  if (Object.keys(updateOps).length === 0) return

  await UserProfile.updateOne(
    { projectId, distinctId: $distinct_id },
    {
      ...updateOps,
      $setOnInsert: { firstSeen: new Date() },
    },
    { upsert: true, arrayFilters } as any
  )
}

export async function updateProfileLastSeen(
  projectId: Types.ObjectId,
  distinctId: string
): Promise<void> {
  await UserProfile.updateOne(
    { projectId, distinctId },
    {
      $set: { lastSeen: new Date() },
      $inc: { totalEvents: 1 },
      $setOnInsert: { firstSeen: new Date() },
    },
    { upsert: true }
  )
}

function prefixProperties(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    result[`properties.${k}`] = v
  }
  return result
}
