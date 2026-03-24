import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { Types } from 'mongoose'

export function signToken(userId: Types.ObjectId, orgId: Types.ObjectId): string {
  return jwt.sign(
    { userId: userId.toString(), orgId: orgId.toString() },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  )
}
