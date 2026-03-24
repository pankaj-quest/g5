import Bull from 'bull'
import { env } from '../config/env.js'

export const identityMergeQueue = new Bull('identity-merge', env.REDIS_URL)

// Process identity merge jobs
identityMergeQueue.process(async (job) => {
  const { Event } = await import('../models/Event.model.js')
  const { UserProfile } = await import('../models/UserProfile.model.js')
  const { Types } = await import('mongoose')

  const { projectId, deviceId, userId } = job.data
  const pid = new Types.ObjectId(projectId)

  // Find existing profiles
  const [deviceProfile, userProfile] = await Promise.all([
    UserProfile.findOne({ projectId: pid, distinctId: deviceId }),
    UserProfile.findOne({ projectId: pid, distinctId: userId }),
  ])

  if (userProfile) {
    // Merge device profile into user profile
    if (deviceProfile) {
      await UserProfile.updateOne(
        { _id: userProfile._id },
        {
          $addToSet: { deviceIds: deviceId, aliases: deviceId },
        }
      )
      await UserProfile.deleteOne({ _id: deviceProfile._id })
    } else {
      await UserProfile.updateOne(
        { _id: userProfile._id },
        { $addToSet: { deviceIds: deviceId } }
      )
    }
  } else if (deviceProfile) {
    // Rename anonymous profile to user
    await UserProfile.updateOne(
      { _id: deviceProfile._id },
      {
        $set: { distinctId: userId },
        $addToSet: { deviceIds: deviceId, aliases: deviceId },
      }
    )
  }

  // Retroactive event reattribution
  await Event.updateMany(
    { projectId: pid, originalDistinctId: deviceId },
    { $set: { distinctId: userId } }
  )
})
