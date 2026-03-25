import { QueuedEvent } from '../types/index.js'

/**
 * Send batch of events to /import endpoint.
 * Includes x-g5-token header for authentication.
 * Falls back from sendBeacon → fetch with keepalive.
 */
export async function sendEvents(
  apiHost: string,
  token: string,
  events: QueuedEvent[]
): Promise<void> {
  const url = `${apiHost}/import`
  const payload = events.map((e) => ({ event: e.event, properties: e.properties }))
  const body = JSON.stringify(payload)

  // sendBeacon for page-unload (can't set custom headers, token is in payload)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon(url, blob)) return
  }

  // Fallback: fetch with token header
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-g5-token': token,
    },
    body,
    keepalive: true,
  })
}

/**
 * Send a single request to a specific endpoint (/engage, /groups, /track).
 * Includes x-g5-token header for authentication.
 */
export async function sendSingle(
  apiHost: string,
  token: string,
  endpoint: string,
  payload: Record<string, unknown>
): Promise<void> {
  await fetch(`${apiHost}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-g5-token': token,
    },
    body: JSON.stringify(payload),
  })
}
