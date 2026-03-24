// Convert Mixpanel-style Unix timestamp (seconds or milliseconds) to Date
export function fromUnixTimestamp(ts: number): Date {
  // If ts > 1e12 it's already milliseconds
  return new Date(ts > 1e12 ? ts : ts * 1000)
}

export function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}
