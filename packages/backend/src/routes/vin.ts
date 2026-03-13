import { Hono } from 'hono';
import { db } from '../config/database.js';
import { vins, vinPreferences } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getPillarsForVin, getTimelineForVin } from '../services/pillar-engine.js';
import { getGovernanceForVin, buildServiceSuggestion } from '../services/governance.js';

export const vinRoute = new Hono();

function computeSortContext(vin: typeof vins.$inferSelect) {
  const lastEvent = new Date(vin.last_event_at).getTime();
  const ageHours = (Date.now() - lastEvent) / (60 * 60 * 1000);
  const stale = ageHours > 48 * 30;

  const h = vin.vin_code.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const r1 = Math.abs(h % 100);
  const r2 = Math.abs((h * 3) % 100);
  const r3 = Math.abs((h * 7) % 100);

  return {
    schema_version: 'slc_v1',
    as_of: vin.last_event_at.toISOString(),
    vas: stale ? -1 : Math.min(100, Math.max(5, Math.round(vin.posterior_p * 55 + r1 * 0.45))),
    esc: stale ? -1 : Math.min(100, Math.max(5, Math.round(vin.posterior_s * 50 + r2 * 0.50))),
    tsi: stale ? -1 : Math.min(100, Math.max(5, Math.round(vin.posterior_c * 45 + r3 * 0.55))),
    stale,
  };
}

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

  return c.json({
    vin: {
      ...vin,
      last_event_at: vin.last_event_at.toISOString(),
      created_at: vin.created_at.toISOString(),
      updated_at: vin.updated_at.toISOString(),
    },
    pillars,
    timeline,
    governance,
    service_suggestion,
    sort_context: computeSortContext(vin),
  });
});

vinRoute.post('/:vin_id/preferences', async (c) => {
  const vinId = c.req.param('vin_id');
  const body = await c.req.json();

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
