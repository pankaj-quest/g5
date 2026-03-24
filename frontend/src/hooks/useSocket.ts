import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getSocket, connectSocket } from '../lib/socket.js'
import { addLiveEvent, setStats, setConnected } from '../store/realtime.slice.js'

export function useSocket(projectId: string) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!projectId) return

    const socket = getSocket()
    connectSocket()

    socket.emit('join:project', projectId)

    socket.on('connect', () => dispatch(setConnected(true)))
    socket.on('disconnect', () => dispatch(setConnected(false)))
    socket.on('live:event', (data) => dispatch(addLiveEvent(data)))
    socket.on('live:stats', (data) => dispatch(setStats(data)))

    return () => {
      socket.off('live:event')
      socket.off('live:stats')
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [projectId, dispatch])
}
