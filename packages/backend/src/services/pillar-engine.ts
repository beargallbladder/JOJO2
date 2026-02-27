import { db } from '../config/database.js';
import { pillarEvents, posteriorSnapshots } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

export async function getPillarsForVin(vinId: string) {
  return db.select().from(pillarEvents).where(eq(pillarEvents.vin_id, vinId)).orderBy(asc(pillarEvents.occurred_at));
}

export async function getTimelineForVin(vinId: string) {
  return db.select().from(posteriorSnapshots).where(eq(posteriorSnapshots.vin_id, vinId)).orderBy(asc(posteriorSnapshots.frame_index));
}
