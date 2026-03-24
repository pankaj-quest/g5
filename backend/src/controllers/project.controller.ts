import { Request, Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Project } from '../models/Project.model.js'
import { Organization } from '../models/Organization.model.js'
import { createServiceAccount } from '../services/auth/serviceAccount.service.js'
import { ServiceAccountScope } from '../models/ServiceAccount.model.js'

export async function createProject(req: Request, res: Response) {
  const { name, timezone } = req.body
  const orgId = req.orgId!

  const org = await Organization.findById(orgId)
  if (!org) {
    res.status(404).json({ error: 'Organization not found' })
    return
  }

  const secretKey = crypto.randomBytes(32).toString('hex')
  const secretKeyHash = await bcrypt.hash(secretKey, 10)

  const project = await Project.create({
    orgId,
    name,
    timezone: timezone || 'UTC',
    secretKeyHash,
  })

  res.status(201).json({
    id: project._id,
    name: project.name,
    token: project.token,
    secretKey, // shown once
    timezone: project.timezone,
  })
}

export async function listProjects(req: Request, res: Response) {
  const orgId = req.orgId!
  const projects = await Project.find({ orgId }).select('-secretKeyHash').lean()
  res.json(projects)
}

export async function getProject(req: Request, res: Response) {
  const { projectId } = req.params
  const project = await Project.findById(projectId).select('-secretKeyHash').lean()
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json(project)
}

export async function issueServiceAccount(req: Request, res: Response) {
  const { projectId } = req.params
  const { name, scopes } = req.body
  const orgId = req.orgId!

  const sa = await createServiceAccount(
    req.projectId! || (projectId as unknown as import('mongoose').Types.ObjectId),
    orgId,
    name,
    scopes as ServiceAccountScope[]
  )

  res.status(201).json(sa)
}
