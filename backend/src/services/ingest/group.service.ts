import { Types } from 'mongoose'
import { GroupProfile } from '../../models/GroupProfile.model.js'

export interface GroupPayload {
  $group_key: string
  $group_id: string
  $set?: Record<string, unknown>
  $set_once?: Record<string, unknown>
  $increment?: Record<string, number>
  $append?: Record<string, unknown>
  $union?: Record<string, unknown[]>
  $unset?: string | string[]
  $remove?: Record<string, unknown>
  $delete?: string
}

export async function applyGroupOperation(
  projectId: Types.ObjectId,
  payload: GroupPayload
): Promise<void> {
  const { $group_key, $group_id } = payload

  if ('$delete' in payload) {
    await GroupProfile.deleteOne({ projectId, groupKey: $group_key, groupId: $group_id })
    return
  }

  const updateOps: Record<string, unknown> = {}

  if (payload.$set) updateOps.$set = prefixProperties(payload.$set)
  if (payload.$increment) updateOps.$inc = prefixProperties(payload.$increment)
  if (payload.$append) updateOps.$push = prefixProperties(payload.$append)

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

  if (payload.$remove) updateOps.$pull = prefixProperties(payload.$remove)

  if (payload.$set_once) {
    const profile = await GroupProfile.findOne({
      projectId,
      groupKey: $group_key,
      groupId: $group_id,
    }).lean()
    const setOnceOps: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(payload.$set_once)) {
      if (!profile?.properties || !(profile.properties as unknown as Map<string, unknown>).has?.(k)) {
        setOnceOps[`properties.${k}`] = v
      }
    }
    if (Object.keys(setOnceOps).length > 0) {
      if (updateOps.$set) Object.assign(updateOps.$set as Record<string, unknown>, setOnceOps)
      else updateOps.$set = setOnceOps
    }
  }

  if (Object.keys(updateOps).length === 0) return

  await GroupProfile.updateOne(
    { projectId, groupKey: $group_key, groupId: $group_id },
    { ...updateOps, $setOnInsert: { firstSeen: new Date() }, $set: { ...(updateOps.$set as object), lastSeen: new Date() } },
    { upsert: true }
  )
}

function prefixProperties(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) result[`properties.${k}`] = v
  return result
}
