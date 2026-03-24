import { Types } from 'mongoose'
import { UserProfile } from '../../models/UserProfile.model.js'
import { identityMergeQueue } from '../../workers/ingestQueue.js'
import { pubsubEnabled } from '../../pubsub/client.js'
import { publishIdentityMerge } from '../../pubsub/publisher.js'

// Returns the canonical distinctId after identity resolution
export async function resolveIdentity(
  projectId: Types.ObjectId,
  rawDistinctId: string,
  properties: Record<string, unknown>
): Promise<string> {
  const deviceId = properties['$device_id'] ? String(properties['$device_id']) : null
  const userId = properties['$user_id'] ? String(properties['$user_id']) : null

  // If both $device_id and $user_id are present → trigger merge
  if (deviceId && userId) {
    if (pubsubEnabled) {
      publishIdentityMerge(projectId.toString(), deviceId, userId)
    } else {
      identityMergeQueue.add({ projectId: projectId.toString(), deviceId, userId }).catch(() => null)
    }

    return userId
  }

  // Check if rawDistinctId is a known device alias → remap to user
  if (!userId) {
    const profile = await UserProfile.findOne({
      projectId,
      deviceIds: rawDistinctId,
    })
      .select('distinctId')
      .lean()

    if (profile) return profile.distinctId
  }

  return rawDistinctId
}
