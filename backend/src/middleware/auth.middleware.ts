import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { ServiceAccount } from '../models/ServiceAccount.model.js'
import { Types } from 'mongoose'

interface JWTPayload {
  userId: string
  orgId: string
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization required' })
    return
  }

  // Service account: Basic auth
  if (authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6)
    const decoded = Buffer.from(base64, 'base64').toString('utf8')
    const [prefix, secret] = decoded.split(':')

    if (!prefix || !secret) {
      res.status(401).json({ error: 'Invalid service account credentials' })
      return
    }

    const tokenPrefix = prefix.slice(0, 8)
    const sa = await ServiceAccount.findOne({ tokenPrefix }).lean()
    if (!sa) {
      res.status(401).json({ error: 'Invalid service account' })
      return
    }

    const valid = await bcrypt.compare(`${prefix}:${secret}`, sa.tokenHash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid service account credentials' })
      return
    }

    req.serviceAccountId = sa._id as Types.ObjectId
    req.projectId = sa.projectId
    req.orgId = sa.orgId
    req.authType = 'service_account'
    return next()
  }

  // JWT Bearer token
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload
      req.userId = new Types.ObjectId(payload.userId)
      req.orgId = new Types.ObjectId(payload.orgId)
      req.authType = 'jwt'
      return next()
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }
  }

  res.status(401).json({ error: 'Invalid authorization format' })
}
