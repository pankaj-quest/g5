import { sendSingle } from './transport.js'

export class GroupClient {
  private apiHost: string
  private token: string
  private groupKey: string
  private groupId: string

  constructor(apiHost: string, token: string, groupKey: string, groupId: string) {
    this.apiHost = apiHost
    this.token = token
    this.groupKey = groupKey
    this.groupId = groupId
  }

  private async send(ops: Record<string, unknown>): Promise<void> {
    await sendSingle(this.apiHost, '/groups', {
      $token: this.token,
      $group_key: this.groupKey,
      $group_id: this.groupId,
      ...ops,
    })
  }

  async set(properties: Record<string, unknown>): Promise<void> {
    await this.send({ $set: properties })
  }

  async set_once(properties: Record<string, unknown>): Promise<void> {
    await this.send({ $set_once: properties })
  }

  async increment(property: string, value = 1): Promise<void> {
    await this.send({ $increment: { [property]: value } })
  }

  async unset(property: string | string[]): Promise<void> {
    await this.send({ $unset: Array.isArray(property) ? property : [property] })
  }
}
