import { Schema, model, Document, Types } from 'mongoose'

export interface IOrganization extends Document {
  name: string
  slug: string
  plan: 'free' | 'growth' | 'enterprise'
  ownerId: Types.ObjectId
  members: Array<{
    userId: Types.ObjectId
    role: 'owner' | 'admin' | 'member'
    joinedAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ['free', 'growth', 'enterprise'], default: 'free' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'admin', 'member'], required: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

export const Organization = model<IOrganization>('Organization', OrganizationSchema)
