import { Persistence } from '../core/Persistence.js'
import { getOrCreateDeviceId, clearDeviceId } from './DeviceId.js'

const USER_ID_KEY = 'user_id'

export class IdentityManager {
  private persistence: Persistence
  private _deviceId: string
  private _userId: string | null

  constructor(persistence: Persistence) {
    this.persistence = persistence
    this._deviceId = getOrCreateDeviceId(persistence)
    this._userId = persistence.get(USER_ID_KEY)
  }

  get deviceId(): string {
    return this._deviceId
  }

  get userId(): string | null {
    return this._userId
  }

  get distinctId(): string {
    return this._userId || this._deviceId
  }

  identify(userId: string): void {
    this._userId = userId
    this.persistence.set(USER_ID_KEY, userId)
  }

  reset(): void {
    this._userId = null
    this.persistence.remove(USER_ID_KEY)
    this._deviceId = clearDeviceId(this.persistence)
  }

  getIdentityProperties(): Record<string, string> {
    const props: Record<string, string> = {
      $device_id: this._deviceId,
    }
    if (this._userId) {
      props['$user_id'] = this._userId
    }
    return props
  }
}
