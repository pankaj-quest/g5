import { QueuedEvent } from '../types/index.js'

/**
 * Send batch of events to /import endpoint.
 * Uses fetch with x-g5-token header.
 * sendBeacon is only used as last resort on page unload (no custom headers possible).
 */
export async function sendEvents(
  apiHost: string,
  token: string,
  events: QueuedEvent[],
  useBeacon = false
): Promise<void> {
  const url = `${apiHost}/import`
  const payload = events.map((e) => ({ event: e.event, properties: e.properties }))
  const body = JSON.stringify(payload)

  // sendBeacon only for page-unload (can't set headers, token must be in payload properties)
  if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon(url, blob)) return
  }

  // Primary: fetch with proper auth header
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
