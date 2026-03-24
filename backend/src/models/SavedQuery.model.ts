import { Schema, model, Document, Types } from 'mongoose'

export type QueryType = 'insights' | 'funnel' | 'retention' | 'flows' | 'cohort'

export interface ISavedQuery extends Document {
  projectId: Types.ObjectId
  type: QueryType
  name: string
  config: Record<string, unknown>
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SavedQuerySchema = new Schema<ISavedQuery>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    type: {
      type: String,
      enum: ['insights', 'funnel', 'retention', 'flows', 'cohort'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    config: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

SavedQuerySchema.index({ projectId: 1, type: 1 })

export const SavedQuery = model<ISavedQuery>('SavedQuery', SavedQuerySchema)
