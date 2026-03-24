import { getIO } from '../../socket.js'

export async function broadcastEvent(
  projectId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const io = getIO()
  io.to(`project:${projectId}`).emit('live:event', payload)
}

export async function broadcastProfileUpdate(
  projectId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const io = getIO()
  io.to(`project:${projectId}`).emit('live:profile_update', payload)
}
