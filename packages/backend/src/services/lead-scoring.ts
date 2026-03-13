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
  const now = Date.now();
  const ageHours = (now - lastEvent) / (60 * 60 * 1000);
  const stale = ageHours > 48;

  const seed = vin.vin_code.charCodeAt(3) * 137 + vin.vin_code.charCodeAt(7) * 29;
  const vas = stale ? -1 : Math.min(100, Math.max(0, Math.round(vin.posterior_p * 40 + (seed % 60))));
  const esc = stale ? -1 : Math.min(100, Math.max(0, Math.round(vin.posterior_s * 35 + ((seed * 3) % 65))));
  const tsi = stale ? -1 : Math.min(100, Math.max(0, Math.round(vin.posterior_c * 30 + ((seed * 7) % 70))));

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
