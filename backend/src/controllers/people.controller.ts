import { Request, Response } from 'express'
import { UserProfile } from '../models/UserProfile.model.js'

export async function listPeople(req: Request, res: Response) {
  const projectId = req.projectId!
  const { search, limit = 50, page = 1 } = req.query

  const filter: Record<string, unknown> = { projectId }
  if (search) {
    filter.distinctId = { $regex: String(search), $options: 'i' }
  }

  const profiles = await UserProfile.find(filter)
    .select('-__v')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .lean()

  res.json(profiles)
}

export async function getProfile(req: Request, res: Response) {
  const projectId = req.projectId!
  const { profileId } = req.params

  const profile = await UserProfile.findOne({ projectId, _id: profileId }).lean()
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' })
    return
  }
  res.json(profile)
}
