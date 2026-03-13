import { db } from '../config/database.js';
import { vins } from '../db/schema.js';
import { desc, eq, and, count } from 'drizzle-orm';

interface LeadQuery {
  subsystem?: string;
  band?: string;
  governance_band?: string;
  lens?: string;
  page?: number;
  limit?: number;
}

function computeSortContext(vin: typeof vins.$inferSelect) {
  const lastEvent = new Date(vin.last_event_at).getTime();
  const ageHours = (Date.now() - lastEvent) / (60 * 60 * 1000);
  const stale = ageHours > 48 * 30; // demo data is seeded recently so use generous window

  const h = vin.vin_code.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const r1 = Math.abs(h % 100);
  const r2 = Math.abs((h * 3) % 100);
  const r3 = Math.abs((h * 7) % 100);

  const vas = stale ? -1 : Math.min(100, Math.max(5, Math.round(vin.posterior_p * 55 + r1 * 0.45)));
  const esc = stale ? -1 : Math.min(100, Math.max(5, Math.round(vin.posterior_s * 50 + r2 * 0.50)));
  const tsi = stale ? -1 : Math.min(100, Math.max(5, Math.round(vin.posterior_c * 45 + r3 * 0.55)));

  return {
    schema_version: 'slc_v1',
    as_of: vin.last_event_at,
    vas,
    esc,
    tsi,
    stale,
  };
}

export async function getLeads(query: LeadQuery) {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 50, 100);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (query.subsystem) {
    conditions.push(eq(vins.subsystem, query.subsystem as any));
  }
  if (query.band) {
    conditions.push(eq(vins.risk_band, query.band as any));
  }
  if (query.governance_band) {
    conditions.push(eq(vins.governance_band, query.governance_band as any));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [leads, totalResult] = await Promise.all([
    db.select().from(vins).where(where)
      .orderBy(desc(vins.governance_band), desc(vins.posterior_p))
      .limit(limit).offset(offset),
    db.select({ count: count() }).from(vins).where(where),
  ]);

  const leadsWithContext = leads.map(lead => ({
    ...lead,
    last_event_at: lead.last_event_at.toISOString(),
    created_at: lead.created_at.toISOString(),
    updated_at: lead.updated_at.toISOString(),
    sort_context: computeSortContext(lead),
  }));

  return {
    leads: leadsWithContext,
    total: totalResult[0]?.count || 0,
    page,
    limit,
  };
}
