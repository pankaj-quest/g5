import { Persistence } from '../core/Persistence.js'

const DEVICE_ID_KEY = 'device_id'

export function getOrCreateDeviceId(persistence: Persistence): string {
  const existing = persistence.get(DEVICE_ID_KEY)
  if (existing) return existing

  const id = generateUUID()
  persistence.set(DEVICE_ID_KEY, id)
  return id
}

export function clearDeviceId(persistence: Persistence): string {
  const newId = generateUUID()
  persistence.set(DEVICE_ID_KEY, newId)
  return newId
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
