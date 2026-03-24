import { Persistence } from './Persistence.js'
import { QueuedEvent } from '../types/index.js'

const QUEUE_KEY = 'event_queue'
const MAX_QUEUE_SIZE = 1000

export class EventQueue {
  private persistence: Persistence
  private queue: QueuedEvent[]

  constructor(persistence: Persistence) {
    this.persistence = persistence
    this.queue = this.load()
  }

  enqueue(event: QueuedEvent): void {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.queue.shift() // drop oldest
    }
    this.queue.push(event)
    this.save()
  }

  flush(): QueuedEvent[] {
    const items = [...this.queue]
    this.queue = []
    this.save()
    return items
  }

  size(): number {
    return this.queue.length
  }

  private load(): QueuedEvent[] {
    try {
      const raw = this.persistence.get(QUEUE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  private save(): void {
    this.persistence.set(QUEUE_KEY, JSON.stringify(this.queue))
  }
}
