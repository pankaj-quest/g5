import { Schema, model, Document, Types } from 'mongoose'

export type ServiceAccountScope = 'ingest' | 'export' | 'analytics' | 'admin'

export interface IServiceAccount extends Document {
  projectId: Types.ObjectId
  orgId: Types.ObjectId
  name: string
  tokenHash: string
  tokenPrefix: string // first 8 chars for lookup
  scopes: ServiceAccountScope[]
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ServiceAccountSchema = new Schema<IServiceAccount>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    tokenHash: { type: String, required: true },
    tokenPrefix: { type: String, required: true },
    scopes: [{ type: String, enum: ['ingest', 'export', 'analytics', 'admin'] }],
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
)

ServiceAccountSchema.index({ tokenPrefix: 1 })
ServiceAccountSchema.index({ projectId: 1 })

export const ServiceAccount = model<IServiceAccount>('ServiceAccount', ServiceAccountSchema)
