import { Request, Response, NextFunction } from 'express'
import { Project } from '../models/Project.model.js'
import { redis } from '../services/realtime/redis.js'
import { PROJECT_TOKEN_CACHE_TTL } from '../config/constants.js'
import { Types } from 'mongoose'

// Resolves project token → projectId, with Redis cache (graceful fallback if Redis unavailable)
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

  // Try Redis cache first (skip if Redis unavailable)
  try {
    if (redis.status === 'ready') {
      const cacheKey = `project_token:${token}`
      const cached = await redis.get(cacheKey)
      if (cached) {
        req.projectId = new Types.ObjectId(cached)
        return next()
      }
    }
  } catch {
    // Redis unavailable — fall through to MongoDB
  }

  const project = await Project.findOne({ token }).select('_id').lean()
  if (!project) {
    res.status(401).json({ error: 'Invalid project token' })
    return
  }

  // Try to cache in Redis (non-blocking)
  try {
    if (redis.status === 'ready') {
      redis.setex(`project_token:${token}`, PROJECT_TOKEN_CACHE_TTL, project._id.toString()).catch(() => null)
    }
  } catch {
    // Ignore cache write failures
  }

  req.projectId = project._id as Types.ObjectId
  next()
}
