import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Types } from 'mongoose'
import { ServiceAccount, ServiceAccountScope } from '../../models/ServiceAccount.model.js'

export interface CreatedServiceAccount {
  id: string
  name: string
  token: string // returned once, never stored plaintext
  prefix: string
  scopes: ServiceAccountScope[]
}

export async function createServiceAccount(
  projectId: Types.ObjectId,
  orgId: Types.ObjectId,
  name: string,
  scopes: ServiceAccountScope[]
): Promise<CreatedServiceAccount> {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const prefix = rawToken.slice(0, 8)
  // Hash prefix:rawToken combo
  const tokenHash = await bcrypt.hash(`${prefix}:${rawToken}`, 10)

  const sa = await ServiceAccount.create({
    projectId,
    orgId,
    name,
    tokenHash,
    tokenPrefix: prefix,
    scopes,
  })

  return {
    id: sa._id.toString(),
    name: sa.name,
    token: rawToken, // shown once
    prefix,
    scopes,
  }
}
