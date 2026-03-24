import { sendSingle } from './transport.js'
import { IdentityManager } from '../identity/IdentityManager.js'

export class People {
  private apiHost: string
  private token: string
  private identity: IdentityManager

  constructor(apiHost: string, token: string, identity: IdentityManager) {
    this.apiHost = apiHost
    this.token = token
    this.identity = identity
  }

  private async send(ops: Record<string, unknown>): Promise<void> {
    await sendSingle(this.apiHost, '/engage', {
      $distinct_id: this.identity.distinctId,
      $token: this.token,
      ...ops,
    })
  }

  async set(properties: Record<string, unknown>): Promise<void> {
    await this.send({ $set: properties })
  }

  async set_once(properties: Record<string, unknown>): Promise<void> {
    await this.send({ $set_once: properties })
  }

  async increment(property: string | Record<string, number>, value?: number): Promise<void> {
    const ops = typeof property === 'string' ? { [property]: value ?? 1 } : property
    await this.send({ $increment: ops })
  }

  async append(property: string, value: unknown): Promise<void> {
    await this.send({ $append: { [property]: value } })
  }

  async union(property: string, values: unknown[]): Promise<void> {
    await this.send({ $union: { [property]: values } })
  }

  async unset(property: string | string[]): Promise<void> {
    await this.send({ $unset: Array.isArray(property) ? property : [property] })
  }

  async remove(property: string, value: unknown): Promise<void> {
    await this.send({ $remove: { [property]: value } })
  }

  async delete_profile(): Promise<void> {
    await this.send({ $delete: '' })
  }
}
