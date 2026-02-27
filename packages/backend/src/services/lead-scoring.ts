import { db } from '../config/database.js';
import { vins } from '../db/schema.js';
import { desc, eq, and, gte, lt, sql, count } from 'drizzle-orm';

interface LeadQuery {
  subsystem?: string;
  band?: string;
  page?: number;
  limit?: number;
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

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [leads, totalResult] = await Promise.all([
    db.select().from(vins).where(where).orderBy(desc(vins.posterior_p)).limit(limit).offset(offset),
    db.select({ count: count() }).from(vins).where(where),
  ]);

  return {
    leads,
    total: totalResult[0]?.count || 0,
    page,
    limit,
  };
}
