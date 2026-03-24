import { Schema, model, Document, Types } from 'mongoose'

export interface ITeam extends Document {
  projectId: Types.ObjectId
  orgId: Types.ObjectId
  name: string
  members: Array<{ userId: Types.ObjectId; role: 'editor' | 'analyst' | 'viewer' }>
  permissions: {
    canExport: boolean
    canManageReports: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const TeamSchema = new Schema<ITeam>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['editor', 'analyst', 'viewer'], required: true },
      },
    ],
    permissions: {
      canExport: { type: Boolean, default: true },
      canManageReports: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
)

TeamSchema.index({ projectId: 1 })
TeamSchema.index({ orgId: 1 })

export const Team = model<ITeam>('Team', TeamSchema)
