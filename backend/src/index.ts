import './config/env.js' // validate env first
import http from 'http'
import { createApp } from './app.js'
import { connectDB } from './config/db.js'
import { redis } from './services/realtime/redis.js'
import { initSocket } from './socket.js'
import { initPubSub, shutdownPubSub } from './pubsub/index.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'

async function bootstrap() {
  await connectDB()
  await redis.connect().catch((err) => {
    logger.warn('Redis connection failed — caching and realtime features will be unavailable', { err: String(err) })
  })

  const app = createApp()
  const httpServer = http.createServer(app)
  await initSocket(httpServer)

  // Initialize Pub/Sub (publisher + consumers) if enabled
  await initPubSub()

  httpServer.listen(env.PORT, () => {
    logger.info(`G5 API running on port ${env.PORT}`)
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`)

    httpServer.close()
    await shutdownPubSub()
    await redis.quit()
    logger.info('Shutdown complete')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('Fatal startup error', err)
  process.exit(1)
})
