import { Hono } from 'hono';
import { db } from '../config/database.js';
import { dealerDirectory, vinPreferences } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export const dealersRoute = new Hono();

dealersRoute.get('/search', async (c) => {
  const homeArea = c.req.query('home_area');
  const vinId = c.req.query('vin_id');
  const max = parseInt(c.req.query('max') || '4');

  let dealers;
  if (homeArea) {
    // Get dealers in same area first, then nearby
    dealers = await db.select().from(dealerDirectory)
      .where(eq(dealerDirectory.postal_prefix, homeArea))
      .limit(max);

    // If not enough, get more from other areas
    if (dealers.length < max) {
      const more = await db.select().from(dealerDirectory)
        .where(sql`${dealerDirectory.postal_prefix} != ${homeArea}`)
        .limit(max - dealers.length);
      dealers = [...dealers, ...more];
    }
  } else {
    dealers = await db.select().from(dealerDirectory).limit(max);
  }

  // If vin_id provided, mark preferred dealer
  if (vinId) {
    const [prefs] = await db.select().from(vinPreferences).where(eq(vinPreferences.vin_id, vinId));
    if (prefs?.preferred_dealer_id) {
      dealers = dealers.map(d => ({
        ...d,
        is_preferred: d.id === prefs.preferred_dealer_id,
      }));
    }
  }

  return c.json({ dealers });
});
