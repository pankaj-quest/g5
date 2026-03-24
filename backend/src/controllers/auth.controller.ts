import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.model.js'
import { Organization } from '../models/Organization.model.js'
import { Project } from '../models/Project.model.js'
import { signToken } from '../services/auth/jwt.service.js'

export async function register(req: Request, res: Response) {
  const { email, password, name, orgName } = req.body

  if (!email || !password || !name || !orgName) {
    res.status(400).json({ error: 'email, password, name, orgName are required' })
    return
  }

  const existing = await User.findOne({ email })
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await User.create({ email, passwordHash, name })

  // Create org slug from orgName
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  const uniqueSlug = `${slug}-${user._id.toString().slice(-6)}`

  const org = await Organization.create({
    name: orgName,
    slug: uniqueSlug,
    ownerId: user._id,
    members: [{ userId: user._id, role: 'owner' }],
  })

  await User.updateOne({ _id: user._id }, { $push: { orgMemberships: org._id } })

  // Auto-create a default project
  const project = await Project.create({
    orgId: org._id,
    name: `${orgName} - Default`,
    timezone: 'UTC',
  })

  const token = signToken(user._id, org._id)
  res.status(201).json({ token, userId: user._id, orgId: org._id, projectId: project._id, projectToken: project.token })
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  const user = await User.findOne({ email })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() })

  // Use first org membership
  const orgId = user.orgMemberships[0]
  const token = signToken(user._id, orgId)
  res.json({ token, userId: user._id, orgId })
}
