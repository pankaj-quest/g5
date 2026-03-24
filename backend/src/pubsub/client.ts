import { PubSub } from '@google-cloud/pubsub'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

// In GCP Cloud Run, credentials are auto-injected. Locally, use GOOGLE_APPLICATION_CREDENTIALS.
export const pubsub = new PubSub({
  projectId: env.GCP_PROJECT_ID || undefined,
})

export const pubsubEnabled = env.PUBSUB_ENABLED

// Topic names
export const TOPIC_EVENTS = 'g5-events-raw'
export const TOPIC_PROFILES = 'g5-profiles-update'
export const TOPIC_GROUPS = 'g5-groups-update'
export const TOPIC_IDENTITY = 'g5-identity-merge'
export const TOPIC_DLQ = 'g5-events-dlq'

// Subscription names (consumers)
export const SUB_EVENT_WRITER = 'g5-event-writer'
export const SUB_REALTIME_FAN = 'g5-realtime-fan'
export const SUB_PROFILE_UPDATER = 'g5-profile-updater'
export const SUB_GROUP_UPDATER = 'g5-group-updater'
export const SUB_IDENTITY_MERGE = 'g5-identity-merge-worker'
