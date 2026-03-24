export interface G5Config {
  apiHost?: string
  batchSize?: number
  flushInterval?: number // ms
  debug?: boolean
  persistence?: 'localStorage' | 'cookie' | 'none'
  cookieDomain?: string
}

export interface TrackProperties {
  [key: string]: unknown
}

export interface PeopleProperties {
  [key: string]: unknown
}

export interface QueuedEvent {
  event: string
  properties: TrackProperties & {
    token: string
    distinct_id: string
    $device_id: string
    $user_id?: string
    time: number
    $insert_id: string
  }
}
