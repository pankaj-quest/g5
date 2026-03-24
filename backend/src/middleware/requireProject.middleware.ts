import { Request, Response, NextFunction } from 'express'
import { Project } from '../models/Project.model.js'
import { Types } from 'mongoose'

// For JWT-auth routes: reads projectId from query/body and verifies org ownership
export async function requireProject(req: Request, res: Response, next: NextFunction) {
  // Service accounts already have projectId set by requireAuth
  if (req.authType === 'service_account') return next()

  const raw = req.query.projectId || req.body?.projectId
  if (!raw) {
    res.status(400).json({ error: 'projectId is required' })
    return
  }

  const project = await Project.findOne({
    _id: new Types.ObjectId(String(raw)),
    orgId: req.orgId,
  }).select('_id').lean()

  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }

  req.projectId = project._id as Types.ObjectId
  next()
}
