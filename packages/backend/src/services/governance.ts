import { db } from '../config/database.js';
import { governanceActions, vins } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const STALENESS_HARD_CEILING = 60;

interface GovernanceResult {
  band: 'ESCALATED' | 'MONITOR' | 'SUPPRESSED';
  reason: string;
}

export function computeGovernanceBand(p: number, c: number, sDays: number): GovernanceResult {
  if (sDays > STALENESS_HARD_CEILING) {
    return { band: 'SUPPRESSED', reason: `S=${sDays}d exceeds ${STALENESS_HARD_CEILING}d ceiling` };
  }

  if (c < 0.50) {
    return { band: 'SUPPRESSED', reason: `C=${c.toFixed(2)} below 0.50 floor — insufficient evidence` };
  }

  if (p >= 0.85 && c >= 0.70 && sDays <= 14) {
    return { band: 'ESCALATED', reason: `P=${p.toFixed(2)} ≥ 0.85, C=${c.toFixed(2)} ≥ 0.70, S=${sDays}d ≤ 14` };
  }

  if (p >= 0.60 && c >= 0.60) {
    return { band: 'MONITOR', reason: `P=${p.toFixed(2)} elevated, C=${c.toFixed(2)} ≥ 0.60 — accumulating signal` };
  }

  if (p < 0.45) {
    return { band: 'SUPPRESSED', reason: `P=${p.toFixed(2)} below 0.45 threshold` };
  }

  return { band: 'SUPPRESSED', reason: `Unmet escalation/monitor criteria (gap zone) — SUPPRESSED by exhaustion` };
}

export function computeStaleness(lastEventAt: string | Date): number {
  const last = new Date(lastEventAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((now - last) / (24 * 60 * 60 * 1000)));
}

export async function getGovernanceForVin(vinId: string) {
  return db.select().from(governanceActions).where(eq(governanceActions.vin_id, vinId)).orderBy(desc(governanceActions.created_at));
}

export function buildServiceSuggestion(
  vin: typeof vins.$inferSelect,
  governance: (typeof governanceActions.$inferSelect)[]
) {
  const sDays = computeStaleness(vin.last_event_at);
  const { band } = computeGovernanceBand(vin.posterior_p, vin.posterior_c, sDays);

  if (band === 'ESCALATED') {
    return {
      recommended: true,
      urgency: 'immediate' as const,
      reason: `P=${vin.posterior_p.toFixed(2)} with strong evidence (C=${vin.posterior_c.toFixed(2)}). Dealer engagement warranted.`,
    };
  }

  if (band === 'MONITOR' && vin.posterior_p >= 0.70) {
    return {
      recommended: true,
      urgency: 'soon' as const,
      reason: `Elevated risk (P=${vin.posterior_p.toFixed(2)}) under monitoring. Schedule proactively.`,
    };
  }

  if (band === 'MONITOR') {
    return {
      recommended: false,
      urgency: 'routine' as const,
      reason: `Monitoring. Evidence accumulating but below action threshold.`,
    };
  }

  return {
    recommended: false,
    urgency: 'none' as const,
    reason: `Suppressed. ${governance.length > 0 ? 'Governance actions logged.' : 'No active risk.'}`,
  };
}
