import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/analytics', {
      path: '/socket.io',
      auth: {
        token: localStorage.getItem('g5_jwt'),
      },
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket(projectToken?: string): void {
  const s = getSocket()
  if (projectToken) {
    s.auth = { ...s.auth, projectToken }
  }
  if (!s.connected) s.connect()
}

export function disconnectSocket(): void {
  socket?.disconnect()
}
