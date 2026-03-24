import { Schema, model, Document, Types } from 'mongoose'

export interface IEvent extends Document {
  projectId: Types.ObjectId
  event: string
  distinctId: string
  originalDistinctId: string
  insertId?: string
  time: Date
  receivedAt: Date
  properties: Map<string, unknown>
  geo: {
    ip?: string
    country?: string
    region?: string
    city?: string
  }
  device: {
    os?: string
    browser?: string
    deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  }
  sessionId?: string
}

const EventSchema = new Schema<IEvent>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  event: { type: String, required: true },
  distinctId: { type: String, required: true },
  originalDistinctId: { type: String, required: true },
  insertId: { type: String, sparse: true },
  time: { type: Date, required: true },
  receivedAt: { type: Date, default: Date.now },
  properties: { type: Map, of: Schema.Types.Mixed, default: {} },
  geo: {
    ip: String,
    country: String,
    region: String,
    city: String,
  },
  device: {
    os: String,
    browser: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown',
    },
  },
  sessionId: String,
})

// Critical indexes — order matters for performance
EventSchema.index({ projectId: 1, time: -1 })
EventSchema.index({ projectId: 1, event: 1, time: -1 })
EventSchema.index({ projectId: 1, distinctId: 1, time: 1 })
EventSchema.index({ projectId: 1, insertId: 1 }, { unique: true, sparse: true })
EventSchema.index({ projectId: 1, 'properties.$**': 1 }) // wildcard for ad-hoc filters

export const Event = model<IEvent>('Event', EventSchema)
