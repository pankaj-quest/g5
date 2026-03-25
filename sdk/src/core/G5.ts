import { G5Config, TrackProperties, QueuedEvent } from '../types/index.js'
import { Persistence } from './Persistence.js'
import { EventQueue } from './EventQueue.js'
import { IdentityManager } from '../identity/IdentityManager.js'
import { People } from '../api/people.js'
import { GroupClient } from '../api/groups.js'
import { sendEvents } from '../api/transport.js'

const DEFAULT_API_HOST = 'https://g5-api-757475034422.asia-south1.run.app'
const DEFAULT_BATCH_SIZE = 50
const DEFAULT_FLUSH_INTERVAL = 10000 // 10s

export class G5Client {
  private token: string
  private config: Required<G5Config>
  private persistence: Persistence
  private queue: EventQueue
  private identity: IdentityManager
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private superProperties: TrackProperties = {}
  private timedEvents: Map<string, number> = new Map()
  private optedOut = false
  private flushing = false

  public people: People

  constructor(token: string, config: G5Config = {}) {
    if (!token || typeof token !== 'string') {
      throw new Error('[G5] init() requires a valid project token string')
    }

    this.token = token
    this.config = {
      apiHost: config.apiHost || DEFAULT_API_HOST,
      batchSize: Math.max(1, Math.min(config.batchSize || DEFAULT_BATCH_SIZE, 2000)),
      flushInterval: Math.max(1000, config.flushInterval || DEFAULT_FLUSH_INTERVAL),
      debug: config.debug || false,
      persistence: config.persistence || 'localStorage',
      cookieDomain: config.cookieDomain || '',
    }

    this.persistence = new Persistence(token, this.config.persistence, this.config.cookieDomain)
    this.queue = new EventQueue(this.persistence)
    this.identity = new IdentityManager(this.persistence)
    this.people = new People(this.config.apiHost, token, this.identity)

    // Restore opt-out state
    this.optedOut = this.persistence.get('opted_out') === 'true'

    this.startFlushTimer()
    this.bindPageUnload()

    if (this.config.debug) {
      console.log('[G5] initialized', { token: token.slice(0, 8) + '...', apiHost: this.config.apiHost })
    }
  }

  track(eventName: string, properties: TrackProperties = {}): void {
    if (this.optedOut) return
    if (!eventName || typeof eventName !== 'string') return

    const now = Date.now()
    const timedStart = this.timedEvents.get(eventName)
    if (timedStart !== undefined) {
      properties['$duration'] = (now - timedStart) / 1000
      this.timedEvents.delete(eventName)
    }

    const event: QueuedEvent = {
      event: eventName,
      properties: {
        ...this.superProperties,
        ...properties,
        ...this.identity.getIdentityProperties(),
        token: this.token,
        distinct_id: this.identity.distinctId,
        time: Math.floor(now / 1000),
        $insert_id: this.generateInsertId(),
      },
    }

    this.queue.enqueue(event)

    if (this.queue.size() >= this.config.batchSize) {
      this.flush()
    }

    if (this.config.debug) {
      console.log('[G5] track', eventName, event.properties)
    }
  }

  track_pageview(properties: TrackProperties = {}): void {
    if (typeof window === 'undefined') return
    this.track('$pageview', {
      $current_url: window.location.href,
      $pathname: window.location.pathname,
      $title: document.title,
      $referrer: document.referrer || undefined,
      ...properties,
    })
  }

  identify(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      if (this.config.debug) console.warn('[G5] identify() requires a non-empty string userId')
      return
    }
    this.identity.identify(userId)
    this.track('$identify', {})
  }

  reset(): void {
    this.flush()
    this.identity.reset()
    this.superProperties = {}
    this.timedEvents.clear()
  }

  register(properties: TrackProperties): void {
    Object.assign(this.superProperties, properties)
  }

  register_once(properties: TrackProperties): void {
    for (const [k, v] of Object.entries(properties)) {
      if (!(k in this.superProperties)) {
        this.superProperties[k] = v
      }
    }
  }

  unregister(property: string): void {
    delete this.superProperties[property]
  }

  time_event(eventName: string): void {
    this.timedEvents.set(eventName, Date.now())
  }

  set_group(groupKey: string, groupId: string): GroupClient {
    this.register({ [groupKey]: groupId })
    return new GroupClient(this.config.apiHost, this.token, groupKey, groupId)
  }

  get_group(groupKey: string, groupId: string): GroupClient {
    return new GroupClient(this.config.apiHost, this.token, groupKey, groupId)
  }

  opt_in_tracking(): void {
    this.optedOut = false
    this.persistence.set('opted_out', 'false')
  }

  opt_out_tracking(): void {
    this.flush()
    this.optedOut = true
    this.persistence.set('opted_out', 'true')
  }

  has_opted_out_tracking(): boolean {
    return this.optedOut
  }

  has_opted_in_tracking(): boolean {
    return !this.optedOut
  }

  clear_opt_in_out_tracking(): void {
    this.persistence.remove('opted_out')
    this.optedOut = false
  }

  async flush(useBeacon = false): Promise<void> {
    // Prevent concurrent flushes
    if (this.flushing) return
    this.flushing = true

    try {
      const events = this.queue.flush()
      if (events.length === 0) return

      await sendEvents(this.config.apiHost, this.token, events, useBeacon)

      if (this.config.debug) {
        console.log(`[G5] flushed ${events.length} events`)
      }
    } catch (err) {
      if (this.config.debug) console.error('[G5] flush failed', err)
    } finally {
      this.flushing = false
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flush()
  }

  private startFlushTimer(): void {
    if (this.flushTimer) clearInterval(this.flushTimer)
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval)
  }

  private bindPageUnload(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush(true)
      })
      window.addEventListener('beforeunload', () => this.flush(true))
    }
  }

  private generateInsertId(): string {
    const ts = Date.now().toString(36)
    const rand = Math.random().toString(36).slice(2, 8)
    return `${ts}${rand}`.slice(0, 36)
  }
}
