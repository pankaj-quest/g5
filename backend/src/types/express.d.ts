import { Types } from 'mongoose'

declare global {
  namespace Express {
    interface Request {
      projectId?: Types.ObjectId
      userId?: Types.ObjectId
      orgId?: Types.ObjectId
      serviceAccountId?: Types.ObjectId
      authType?: 'jwt' | 'service_account'
    }
  }
}
