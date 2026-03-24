import { Types } from 'mongoose'
import { Event } from '../../models/Event.model.js'

// Returns true if event was newly inserted, false if it was a duplicate
export async function deduplicateAndInsert(
  projectId: Types.ObjectId,
  eventDoc: Record<string, unknown>,
  insertId?: string
): Promise<boolean> {
  if (!insertId) {
    // No insertId — always insert (no dedup possible)
    await Event.create(eventDoc)
    return true
  }

  const result = await Event.updateOne(
    { projectId, insertId },
    { $setOnInsert: eventDoc },
    { upsert: true }
  )

  // upsertedCount > 0 means it was a new insert
  return result.upsertedCount > 0
}

// For batch: filter out already-seen insertIds, return filtered list
export async function filterDuplicateBatch(
  projectId: Types.ObjectId,
  insertIds: (string | undefined)[]
): Promise<Set<string>> {
  const defined = insertIds.filter(Boolean) as string[]
  if (defined.length === 0) return new Set()

  const existing = await Event.distinct('insertId', {
    projectId,
    insertId: { $in: defined },
  })

  return new Set(existing)
}
