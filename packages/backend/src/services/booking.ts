import { db } from '../config/database.js';
import { bookingDrafts, fsrSlots } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function createDraft(params: {
  vin_id: string;
  dealer_id: string;
  slot_id: string;
  reason: string;
  contact?: Record<string, string>;
}) {
  const id = uuidv4();
  await db.insert(bookingDrafts).values({
    id,
    vin_id: params.vin_id,
    dealer_id: params.dealer_id,
    slot_id: params.slot_id,
    status: 'draft',
    reason: params.reason,
    contact: params.contact || {},
  });

  const [booking] = await db.select().from(bookingDrafts).where(eq(bookingDrafts.id, id));
  return booking;
}

export async function holdBooking(bookingId: string) {
  await db
    .update(bookingDrafts)
    .set({ status: 'held', updated_at: new Date() })
    .where(eq(bookingDrafts.id, bookingId));

  // Increment booked count on the slot
  const [booking] = await db.select().from(bookingDrafts).where(eq(bookingDrafts.id, bookingId));
  if (booking) {
    await db
      .update(fsrSlots)
      .set({ booked: sql`${fsrSlots.booked} + 1` })
      .where(eq(fsrSlots.id, booking.slot_id));
  }

  return booking;
}
