import express from 'express'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import ingestRoutes from './routes/ingest.routes.js'
import authRoutes from './routes/auth.routes.js'
import projectRoutes from './routes/project.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'

export function createApp() {
  const app = express()

  // Trust proxy (Cloud Run, load balancers) — required for rate limiting + X-Forwarded-For
  app.set('trust proxy', true)

  // SDK ingest endpoints must allow any origin (called from customer websites)
  const sdkCors = cors({ origin: true, credentials: false })
  // Dashboard/auth endpoints use restricted origin
  const dashCors = cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  })

  app.use(compression())
  app.use(express.json({ limit: '11mb' })) // slightly above 10MB batch limit

  // Rate limiting for ingest endpoints
  const ingestLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  })

  app.use('/track', sdkCors, ingestLimiter)
  app.use('/import', sdkCors, ingestLimiter)
  app.use('/engage', sdkCors)
  app.use('/groups', sdkCors)

  // Dashboard routes use restricted CORS
  app.use('/auth', dashCors)
  app.use('/projects', dashCors)
  app.use('/analytics', dashCors)

  // Routes
  app.use('/', ingestRoutes) // /track, /import, /engage, /groups at root (Mixpanel-compatible)
  app.use('/auth', authRoutes)
  app.use('/projects', projectRoutes)
  app.use('/analytics', analyticsRoutes)

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  // Debug endpoint to check event counts
  app.get('/debug/stats', async (_req, res) => {
    const { Event } = await import('./models/Event.model.js')
    const { Project } = await import('./models/Project.model.js')
    const totalEvents = await Event.countDocuments()
    const projects = await Project.find().select('_id name').lean()
    const eventsByProject = await Event.aggregate([
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ])
    res.json({ totalEvents, projects, eventsByProject })
  })

  // Debug endpoint to list recent events
  app.get('/debug/events', async (req, res) => {
    const { Event } = await import('./models/Event.model.js')
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const events = await Event.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('event properties.distinct_id timestamp')
      .lean()
    res.json(events)
  })

  app.use(errorHandler)

  return app
}
