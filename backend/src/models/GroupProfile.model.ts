import { Schema, model, Document, Types } from 'mongoose'

export interface IGroupProfile extends Document {
  projectId: Types.ObjectId
  groupKey: string
  groupId: string
  properties: Map<string, unknown>
  firstSeen: Date
  lastSeen: Date
  memberCount: number
  createdAt: Date
  updatedAt: Date
}

const GroupProfileSchema = new Schema<IGroupProfile>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    groupKey: { type: String, required: true },
    groupId: { type: String, required: true },
    properties: { type: Map, of: Schema.Types.Mixed, default: {} },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    memberCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

GroupProfileSchema.index({ projectId: 1, groupKey: 1, groupId: 1 }, { unique: true })

export const GroupProfile = model<IGroupProfile>('GroupProfile', GroupProfileSchema)
