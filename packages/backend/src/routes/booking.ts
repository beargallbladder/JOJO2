import { Hono } from 'hono';
import { createDraft, holdBooking } from '../services/booking.js';
import { buildServiceSuggestion } from '../services/governance.js';
import { db } from '../config/database.js';
import { vins } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const bookingRoute = new Hono();

bookingRoute.post('/draft', async (c) => {
  const body = await c.req.json();
  const { vin_id, dealer_id, slot_id, contact } = body;

  if (!vin_id || !dealer_id || !slot_id) {
    return c.json({ error: 'vin_id, dealer_id, and slot_id required' }, 400);
  }

  // Auto-compose reason from VIN state
  const [vin] = await db.select().from(vins).where(eq(vins.id, vin_id));
  const reason = vin
    ? `Service draft for ${vin.vin_code} — P-score ${vin.posterior_p.toFixed(3)}, ${vin.risk_band} risk, ${vin.subsystem} subsystem`
    : 'Service draft request';

  const booking = await createDraft({ vin_id, dealer_id, slot_id, reason, contact });
  return c.json({ booking });
});

bookingRoute.post('/hold', async (c) => {
  const body = await c.req.json();
  const { booking_id } = body;

  if (!booking_id) {
    return c.json({ error: 'booking_id required' }, 400);
  }

  const booking = await holdBooking(booking_id);
  if (!booking) {
    return c.json({ error: 'Booking not found' }, 404);
  }

  return c.json({ booking });
});
