import { getIO } from '../../socket.js'

export async function broadcastEvent(
  projectId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const io = getIO()
    io.to(`project:${projectId}`).emit('live:event', payload)
  } catch {
    // Socket.io not initialized or unavailable — skip
  }
}

export async function broadcastProfileUpdate(
  projectId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const io = getIO()
    io.to(`project:${projectId}`).emit('live:profile_update', payload)
  } catch {
    // Socket.io not initialized or unavailable — skip
  }
}
