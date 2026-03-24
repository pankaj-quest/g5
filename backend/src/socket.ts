import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { redis } from './services/realtime/redis.js'
import { env } from './config/env.js'
import jwt from 'jsonwebtoken'
import { Project } from './models/Project.model.js'
import { logger } from './utils/logger.js'
import { REALTIME_STATS_INTERVAL } from './config/constants.js'

let io: Server

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export async function initSocket(httpServer: HttpServer): Promise<void> {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] },
    path: '/socket.io',
  })

  // Redis adapter for horizontal scaling (optional — skip if Redis unavailable)
  try {
    if (redis.status === 'ready' || redis.status === 'connecting') {
      const pubClient = redis.duplicate()
      const subClient = redis.duplicate()
      await Promise.all([pubClient.connect(), subClient.connect()])
      io.adapter(createAdapter(pubClient, subClient))
      logger.info('Socket.io Redis adapter enabled')
    } else {
      logger.warn('Socket.io running without Redis adapter — no horizontal scaling')
    }
  } catch (err) {
    logger.warn('Socket.io Redis adapter failed — running in single-instance mode', { err: String(err) })
  }

  const analytics = io.of('/analytics')

  analytics.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token as string
    const projectToken = socket.handshake.auth.projectToken as string

    if (!token && !projectToken) {
      return next(new Error('Authentication required'))
    }

    try {
      if (token) {
        jwt.verify(token, env.JWT_SECRET)
      }
      if (projectToken) {
        const project = await Project.findOne({ token: projectToken }).select('_id').lean()
        if (!project) return next(new Error('Invalid project token'))
        socket.data.projectId = project._id.toString()
      }
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  analytics.on('connection', (socket: Socket) => {
    socket.on('join:project', async (projectId: string) => {
      await socket.join(`project:${projectId}`)
      socket.data.projectId = projectId
      logger.debug(`Socket joined project:${projectId}`)
    })

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected')
    })
  })

  // Broadcast live stats every 5s (only if Redis available)
  setInterval(async () => {
    try {
      if (redis.status !== 'ready') return

      const rooms = io.of('/analytics').adapter.rooms
      for (const [roomName] of rooms) {
        if (!roomName.startsWith('project:')) continue
        const projectId = roomName.replace('project:', '')
        const key = `stats:epm:${projectId}`
        const count = await redis.getdel(key)
        io.of('/analytics')
          .to(roomName)
          .emit('live:stats', {
            projectId,
            eventsPerInterval: Number(count || 0),
          })
      }
    } catch {
      // Redis unavailable, skip this interval
    }
  }, REALTIME_STATS_INTERVAL)

  logger.info('Socket.io initialized')
}
