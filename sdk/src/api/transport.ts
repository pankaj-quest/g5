import { QueuedEvent } from '../types/index.js'

export async function sendEvents(apiHost: string, events: QueuedEvent[]): Promise<void> {
  const url = `${apiHost}/import`
  const payload = events.map((e) => ({ event: e.event, properties: e.properties }))
  const body = JSON.stringify(payload)

  // Use sendBeacon for page-unload scenarios (fire-and-forget)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon(url, blob)) return
  }

  // Fallback: fetch
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  })
}

export async function sendSingle(
  apiHost: string,
  endpoint: string,
  payload: Record<string, unknown>
): Promise<void> {
  await fetch(`${apiHost}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
