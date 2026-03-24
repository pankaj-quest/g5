export const BATCH_MAX_EVENTS = 2000
export const BATCH_MAX_BYTES = 10 * 1024 * 1024 // 10MB
export const EVENT_MAX_PROPERTIES = 255
export const PROPERTY_MAX_CHARS = 255
export const INSERT_ID_MAX_CHARS = 36
export const PROJECT_TOKEN_CACHE_TTL = 60 // seconds
export const REALTIME_STATS_INTERVAL = 5000 // ms

// Redis cache TTLs (seconds)
export const CACHE_TTL_INSIGHTS = 300 // 5 minutes
export const CACHE_TTL_FUNNELS = 300
export const CACHE_TTL_RETENTION = 600 // 10 minutes
export const CACHE_TTL_FLOWS = 600
export const CACHE_TTL_COHORTS = 300
export const CACHE_TTL_PROJECT_STATS = 30 // 30 seconds
export const CACHE_TTL_PROFILE = 120 // 2 minutes

// Kafka
export const KAFKA_EVENTS_TOPIC = 'g5.events.raw'
export const KAFKA_PROFILES_TOPIC = 'g5.profiles.update'
export const KAFKA_GROUPS_TOPIC = 'g5.groups.update'
export const KAFKA_IDENTITY_TOPIC = 'g5.identity.merge'
export const KAFKA_DLQ_TOPIC = 'g5.events.dlq'
export const KAFKA_CONSUMER_GROUP = 'g5-consumers'
export const KAFKA_BATCH_SIZE = 500 // batch writes to MongoDB
