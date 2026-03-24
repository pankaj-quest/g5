import { Schema, model, Document, Types } from 'mongoose'

export interface IBoard extends Document {
  projectId: Types.ObjectId
  name: string
  createdBy: Types.ObjectId
  isShared: boolean
  layout: Array<{
    reportId: Types.ObjectId
    x: number
    y: number
    w: number
    h: number
  }>
  createdAt: Date
  updatedAt: Date
}

const BoardSchema = new Schema<IBoard>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isShared: { type: Boolean, default: false },
    layout: [
      {
        reportId: { type: Schema.Types.ObjectId, ref: 'SavedQuery', required: true },
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        w: { type: Number, default: 6 },
        h: { type: Number, default: 4 },
      },
    ],
  },
  { timestamps: true }
)

BoardSchema.index({ projectId: 1 })

export const Board = model<IBoard>('Board', BoardSchema)
