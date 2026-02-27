import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { streamVoiceResponse } from '../services/voice.js';
import { db } from '../config/database.js';
import { vins } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getPillarsForVin, getTimelineForVin } from '../services/pillar-engine.js';
import { getGovernanceForVin } from '../services/governance.js';

export const voiceRoute = new Hono();

voiceRoute.post('/vin/:vin_id', async (c) => {
  const vinId = c.req.param('vin_id');
  const body = await c.req.json();

  const [vin] = await db.select().from(vins).where(eq(vins.id, vinId));
  if (!vin) return c.json({ error: 'VIN not found' }, 404);

  const [pillars, timeline, governance] = await Promise.all([
    getPillarsForVin(vinId),
    getTimelineForVin(vinId),
    getGovernanceForVin(vinId),
  ]);

  return streamSSE(c, async (stream) => {
    const gen = streamVoiceResponse({
      scope: 'vin',
      message: body.message || 'Summarize this vehicle\'s risk profile.',
      context: { vin, pillars: pillars.slice(-10), timeline: timeline.slice(-5), governance },
    });

    for await (const chunk of gen) {
      await stream.writeSSE({ data: JSON.stringify(chunk) });
    }
  });
});

voiceRoute.post('/fleet', async (c) => {
  const body = await c.req.json();

  // Get top 20 leads for fleet context
  const topLeads = await db.select().from(vins).orderBy(desc(vins.posterior_p)).limit(20);

  return streamSSE(c, async (stream) => {
    const gen = streamVoiceResponse({
      scope: 'fleet',
      message: body.message || 'Summarize the fleet risk overview.',
      context: { fleet_size: 500, top_leads: topLeads.map(v => ({ vin_code: v.vin_code, p: v.posterior_p, band: v.risk_band, subsystem: v.subsystem })) },
    });

    for await (const chunk of gen) {
      await stream.writeSSE({ data: JSON.stringify(chunk) });
    }
  });
});
