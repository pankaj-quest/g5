import { Schema, model, Document, Types } from 'mongoose'

export interface IUserProfile extends Document {
  projectId: Types.ObjectId
  distinctId: string
  deviceIds: string[]
  aliases: string[]
  properties: Map<string, unknown>
  firstSeen: Date
  lastSeen: Date
  totalEvents: number
  cohortMemberships: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    distinctId: { type: String, required: true },
    deviceIds: [{ type: String }],
    aliases: [{ type: String }],
    properties: { type: Map, of: Schema.Types.Mixed, default: {} },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    totalEvents: { type: Number, default: 0 },
    cohortMemberships: [{ type: Schema.Types.ObjectId, ref: 'SavedQuery' }],
  },
  { timestamps: true }
)

UserProfileSchema.index({ projectId: 1, distinctId: 1 }, { unique: true })
UserProfileSchema.index({ projectId: 1, deviceIds: 1 })
UserProfileSchema.index({ projectId: 1, 'properties.$**': 1 })

export const UserProfile = model<IUserProfile>('UserProfile', UserProfileSchema)
