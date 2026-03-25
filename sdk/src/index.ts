import { G5Client } from './core/G5.js'
import { G5Config } from './types/index.js'

let defaultInstance: G5Client | null = null

// Singleton API (Mixpanel-style usage)
const G5 = {
  init(token: string, config: G5Config = {}): G5Client {
    if (defaultInstance) {
      defaultInstance.destroy()
    }
    defaultInstance = new G5Client(token, config)
    return defaultInstance
  },

  track(eventName: string, properties?: Record<string, unknown>): void {
    defaultInstance?.track(eventName, properties)
  },

  track_pageview(properties?: Record<string, unknown>): void {
    defaultInstance?.track_pageview(properties)
  },

  identify(userId: string): void {
    defaultInstance?.identify(userId)
  },

  reset(): void {
    defaultInstance?.reset()
  },

  register(properties: Record<string, unknown>): void {
    defaultInstance?.register(properties)
  },

  register_once(properties: Record<string, unknown>): void {
    defaultInstance?.register_once(properties)
  },

  unregister(property: string): void {
    defaultInstance?.unregister(property)
  },

  time_event(eventName: string): void {
    defaultInstance?.time_event(eventName)
  },

  set_group(groupKey: string, groupId: string) {
    return defaultInstance?.set_group(groupKey, groupId)
  },

  get_group(groupKey: string, groupId: string) {
    return defaultInstance?.get_group(groupKey, groupId)
  },

  opt_in_tracking(): void {
    defaultInstance?.opt_in_tracking()
  },

  opt_out_tracking(): void {
    defaultInstance?.opt_out_tracking()
  },

  has_opted_out_tracking(): boolean {
    return defaultInstance?.has_opted_out_tracking() ?? false
  },

  has_opted_in_tracking(): boolean {
    return defaultInstance?.has_opted_in_tracking() ?? true
  },

  clear_opt_in_out_tracking(): void {
    defaultInstance?.clear_opt_in_out_tracking()
  },

  get people() {
    return defaultInstance?.people
  },

  flush(): Promise<void> {
    return defaultInstance?.flush() ?? Promise.resolve()
  },

  destroy(): void {
    defaultInstance?.destroy()
    defaultInstance = null
  },

  create(token: string, config: G5Config = {}): G5Client {
    return new G5Client(token, config)
  },
}

export default G5
export { G5Client }
export type { G5Config, TrackProperties, PeopleProperties } from './types/index.js'
