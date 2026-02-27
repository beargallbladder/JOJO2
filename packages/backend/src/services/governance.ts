import { db } from '../config/database.js';
import { governanceActions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export async function getGovernanceForVin(vinId: string) {
  return db.select().from(governanceActions).where(eq(governanceActions.vin_id, vinId)).orderBy(desc(governanceActions.created_at));
}

export function buildServiceSuggestion(vin: { posterior_p: number; posterior_s: number; risk_band: string }, governance: any[]) {
  const hasHold = governance.some(g => g.action_type === 'hold');
  if (hasHold) {
    return { recommended: false, urgency: 'none' as const, reason: 'Governance hold active — manual review required' };
  }
  if (vin.posterior_p >= 0.8) {
    return { recommended: true, urgency: 'immediate' as const, reason: `Critical P-score (${vin.posterior_p.toFixed(3)}) — immediate service recommended` };
  }
  if (vin.posterior_p >= 0.6) {
    return { recommended: true, urgency: 'soon' as const, reason: `High P-score (${vin.posterior_p.toFixed(3)}) — schedule service soon` };
  }
  if (vin.posterior_p >= 0.3) {
    return { recommended: true, urgency: 'routine' as const, reason: `Moderate risk — routine service recommended` };
  }
  return { recommended: false, urgency: 'none' as const, reason: 'Low risk — no action needed' };
}
