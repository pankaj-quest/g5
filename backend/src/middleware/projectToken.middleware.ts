import { Request, Response, NextFunction } from 'express'
import { Project } from '../models/Project.model.js'
import { redis } from '../services/realtime/redis.js'
import { PROJECT_TOKEN_CACHE_TTL } from '../config/constants.js'
import { Types } from 'mongoose'

// Resolves project token → projectId, with Redis cache
export async function resolveProjectToken(req: Request, res: Response, next: NextFunction) {
  // Token can come from body (single or batch), query param, or header
  const firstItem = Array.isArray(req.body) ? req.body[0] : null
  const token =
    req.body?.token ||
    req.body?.properties?.token ||
    firstItem?.properties?.token ||
    firstItem?.token ||
    req.query.token ||
    (req.headers['x-g5-token'] as string)

  if (!token) {
    res.status(401).json({ error: 'Missing project token' })
    return
  }

  const cacheKey = `project_token:${token}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    req.projectId = new Types.ObjectId(cached)
    return next()
  }

  const project = await Project.findOne({ token }).select('_id').lean()
  if (!project) {
    res.status(401).json({ error: 'Invalid project token' })
    return
  }

  await redis.setex(cacheKey, PROJECT_TOKEN_CACHE_TTL, project._id.toString())
  req.projectId = project._id as Types.ObjectId
  next()
}
