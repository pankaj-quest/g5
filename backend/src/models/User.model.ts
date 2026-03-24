import { Schema, model, Document, Types } from 'mongoose'

export interface IUser extends Document {
  email: string
  passwordHash: string
  name: string
  orgMemberships: Types.ObjectId[]
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    orgMemberships: [{ type: Schema.Types.ObjectId, ref: 'Organization' }],
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
)

export const User = model<IUser>('User', UserSchema)
