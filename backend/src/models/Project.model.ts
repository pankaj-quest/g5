import { Schema, model, Document, Types } from 'mongoose'
import crypto from 'crypto'

export interface IProject extends Document {
  orgId: Types.ObjectId
  name: string
  token: string
  secretKeyHash: string
  timezone: string
  dataRetentionDays: number
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    secretKeyHash: { type: String, required: true },
    timezone: { type: String, default: 'UTC' },
    dataRetentionDays: { type: Number, default: 365 },
  },
  { timestamps: true }
)

ProjectSchema.index({ token: 1 }, { unique: true })
ProjectSchema.index({ orgId: 1 })

export const Project = model<IProject>('Project', ProjectSchema)
