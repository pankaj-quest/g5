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

  // Redis adapter for horizontal scaling
  const pubClient = redis.duplicate()
  const subClient = redis.duplicate()
  await Promise.all([pubClient.connect(), subClient.connect()])
  io.adapter(createAdapter(pubClient, subClient))

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

  // Broadcast live stats every 5s for all active project rooms
  setInterval(async () => {
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
  }, REALTIME_STATS_INTERVAL)

  logger.info('Socket.io initialized')
}
