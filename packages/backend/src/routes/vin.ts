import { Hono } from 'hono';
import { db } from '../config/database.js';
import { vins, vinPreferences } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getPillarsForVin, getTimelineForVin } from '../services/pillar-engine.js';
import { getGovernanceForVin, buildServiceSuggestion } from '../services/governance.js';

export const vinRoute = new Hono();

vinRoute.get('/:vin_id', async (c) => {
  const vinId = c.req.param('vin_id');
  const [vin] = await db.select().from(vins).where(eq(vins.id, vinId));

  if (!vin) {
    return c.json({ error: 'VIN not found' }, 404);
  }

  const [pillars, timeline, governance] = await Promise.all([
    getPillarsForVin(vinId),
    getTimelineForVin(vinId),
    getGovernanceForVin(vinId),
  ]);

  const service_suggestion = buildServiceSuggestion(vin, governance);

  return c.json({ vin, pillars, timeline, governance, service_suggestion });
});

vinRoute.post('/:vin_id/preferences', async (c) => {
  const vinId = c.req.param('vin_id');
  const body = await c.req.json();

  // Upsert preferences
  const existing = await db.select().from(vinPreferences).where(eq(vinPreferences.vin_id, vinId));

  if (existing.length > 0) {
    await db.update(vinPreferences).set({
      home_area: body.home_area ?? existing[0].home_area,
      preferred_dealer_id: body.preferred_dealer_id ?? existing[0].preferred_dealer_id,
      use_preferred_first: body.use_preferred_first !== undefined ? (body.use_preferred_first ? 1 : 0) : existing[0].use_preferred_first,
      updated_at: new Date(),
    }).where(eq(vinPreferences.vin_id, vinId));
  } else {
    await db.insert(vinPreferences).values({
      vin_id: vinId,
      home_area: body.home_area,
      preferred_dealer_id: body.preferred_dealer_id,
      use_preferred_first: body.use_preferred_first !== undefined ? (body.use_preferred_first ? 1 : 0) : 1,
    });
  }

  return c.json({ ok: true });
});
