import { v4 as uuidv4 } from 'uuid';
import type { GeneratedVin } from './vin-generator.js';

// NOTE: keep seed generation self-contained.
// Importing workspace TS sources from @gravity/shared breaks backend tsc rootDir constraints on Render.
const PILLAR_NAMES = [
  'dtc_history',
  'recall_status',
  'service_history',
  'warranty_claims',
  'tsb_applicability',
  'field_reports',
  'telematics',
  'inspection_results',
] as const;
type PillarName = (typeof PILLAR_NAMES)[number];

// Simple PRNG for pillar generation
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EVIDENCE_SOURCES = ['OBD-II', 'Dealer Report', 'Telematics', 'Warranty Claim', 'Field Report', 'Inspection', 'TSB Match', 'Customer Report'];

export interface GeneratedPillarEvent {
  id: string;
  vin_id: string;
  pillar_name: PillarName;
  pillar_state: 'present' | 'absent' | 'unknown';
  confidence: number;
  evidence_source: string;
  occurred_at: Date;
  metadata: Record<string, unknown>;
}

export interface GeneratedSnapshot {
  id: string;
  vin_id: string;
  p_score: number;
  c_score: number;
  s_score: number;
  risk_band: 'critical' | 'high' | 'medium' | 'low';
  pillar_vector: Record<PillarName, 'present' | 'absent' | 'unknown'>;
  frame_index: number;
  computed_at: Date;
}

export interface GeneratedVinUpdate {
  vin_id: string;
  posterior_p: number;
  posterior_c: number;
  posterior_s: number;
  risk_band: 'critical' | 'high' | 'medium' | 'low';
  last_event_at: Date;
}

function getRiskBand(p: number): 'critical' | 'high' | 'medium' | 'low' {
  if (p >= 0.8) return 'critical';
  if (p >= 0.6) return 'high';
  if (p >= 0.3) return 'medium';
  return 'low';
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function jitter(rng: () => number, magnitude: number) {
  return (rng() * 2 - 1) * magnitude;
}

function smoothStep(prev: number, target: number, alpha: number) {
  return prev + (target - prev) * alpha;
}

export function generatePillarData(vins: GeneratedVin[]) {
  const allEvents: GeneratedPillarEvent[] = [];
  const allSnapshots: GeneratedSnapshot[] = [];
  const vinUpdates: GeneratedVinUpdate[] = [];
  const now = new Date();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (const vin of vins) {
    const rng = mulberry32(vin.vin_code.charCodeAt(0) * 1000 + vin.vin_code.charCodeAt(10));
    const storyline = vin.storyline;
    const eventCount = 5 + Math.floor(rng() * 25); // 5-30 events
    const frameCount = 8 + Math.floor(rng() * 8); // 8-15 timeline frames
    const startTime = now.getTime() - ninetyDaysMs;

    // Coverage profile (probability a pillar is observed at all).
    // This is where "missing data is calculated" comes from.
    const coverage: Record<PillarName, number> = {
      telematics: 0.85 - rng() * 0.1, // wide coverage
      dtc_history: 0.75 - rng() * 0.15,
      service_history: 0.65 - rng() * 0.25,
      warranty_claims: 0.55 - rng() * 0.25,
      recall_status: 0.9 - rng() * 0.05,
      tsb_applicability: 0.7 - rng() * 0.15,
      field_reports: 0.35 + rng() * 0.25, // sparse, noisy
      inspection_results: 0.4 + rng() * 0.35, // episodic
    };

    // Track recency for staleness. Initialize "unknown" as very stale.
    const lastSeen: Record<PillarName, number> = Object.fromEntries(
      PILLAR_NAMES.map((p) => [p, startTime - 21 * 24 * 60 * 60 * 1000]),
    ) as Record<PillarName, number>;

    // Generate pillar events (evidence arriving) with time clustering.
    // Events create realism: gaps, bursts, and partial coverage.
    for (let i = 0; i < eventCount; i++) {
      // Cluster some events later to create staleness/recency contrast
      const baseT = i / eventCount;
      const t = clamp01(baseT + jitter(rng, 0.08));
      const occurredAt = new Date(startTime + t * ninetyDaysMs);

      const pillarName = (storyline.pillarPattern[Math.floor(rng() * storyline.pillarPattern.length)] ||
        PILLAR_NAMES[Math.floor(rng() * PILLAR_NAMES.length)]) as PillarName;

      // Even if a pillar is in the storyline, it may be missing in reality.
      if (rng() > coverage[pillarName]) continue;

      // Evidence state: mostly present for storyline pillars, otherwise often unknown/absent.
      const storylineBias = storyline.pillarPattern.includes(pillarName) ? 0.65 : 0.35;
      const r = rng();
      const state: 'present' | 'absent' | 'unknown' =
        r < storylineBias ? 'present' : r < storylineBias + 0.25 ? 'absent' : 'unknown';

      const conf = clamp01(0.35 + rng() * 0.55 + (state === 'present' ? 0.05 : -0.05));

      allEvents.push({
        id: uuidv4(),
        vin_id: vin.id,
        pillar_name: pillarName,
        pillar_state: state,
        confidence: Math.round(conf * 100) / 100,
        evidence_source: EVIDENCE_SOURCES[Math.floor(rng() * EVIDENCE_SOURCES.length)],
        occurred_at: occurredAt,
        metadata: { auto_generated: true, storyline: storyline.id },
      });

      lastSeen[pillarName] = occurredAt.getTime();
    }

    // Generate posterior snapshots (timeline frames).
    // P follows the storyline *loosely*; C and S are driven by evidence coverage + staleness + volatility.
    let prevP = clamp01(storyline.pCurve(0) + jitter(rng, 0.06));
    let prevS = clamp01(storyline.sCurve(0) + jitter(rng, 0.05));

    for (let f = 0; f < frameCount; f++) {
      const t = frameCount === 1 ? 1 : f / (frameCount - 1);
      const computedAtMs = startTime + t * ninetyDaysMs;
      const computedAt = new Date(computedAtMs);

      // Evidence vector over ALL pillars (so missingness is explicit).
      const vector = {} as Record<PillarName, 'present' | 'absent' | 'unknown'>;

      let observed = 0;
      let present = 0;
      let absent = 0;

      // We simulate that "observed vs missing" differs by pillar coverage and time.
      // Some pillars may go stale (no new events), which should drag C down even if P stays high.
      for (const pillar of PILLAR_NAMES) {
        const isObserved = rng() < coverage[pillar];

        if (!isObserved) {
          vector[pillar] = 'unknown';
          continue;
        }

        observed++;

        const isStoryPillar = storyline.pillarPattern.includes(pillar);
        const activation = isStoryPillar ? clamp01(0.25 + t * 0.6 + jitter(rng, 0.12)) : clamp01(0.1 + jitter(rng, 0.08));
        const flip = rng() < (pillar === 'field_reports' ? 0.25 : 0.12);

        // "Intermittent flicker" and missing history should produce instability and lower C.
        let state: 'present' | 'absent' | 'unknown';
        if (flip && rng() < 0.5) state = 'absent';
        else state = rng() < activation ? 'present' : rng() < 0.15 ? 'absent' : 'unknown';

        vector[pillar] = state;
        if (state === 'present') present++;
        if (state === 'absent') absent++;

        // Update staleness clock when we have a non-unknown observation.
        if (state !== 'unknown') lastSeen[pillar] = Math.max(lastSeen[pillar], computedAtMs);
      }

      const missingPenalty = 1 - observed / PILLAR_NAMES.length; // 0..1

      // Staleness: how long since any pillar had a non-unknown observation.
      const freshest = Math.max(...Object.values(lastSeen));
      const ageDays = (computedAtMs - freshest) / (24 * 60 * 60 * 1000);
      const stalenessPenalty = clamp01(ageDays / 30); // 0 fresh, 1 stale at ~30d+

      // Volatility proxy: present/absent mix implies conflict => lower confidence.
      const conflict = observed > 0 ? Math.min(1, (absent / Math.max(1, observed)) * 1.6) : 1;

      // Base risk follows storyline, but we add shocks, plateaus, and regression when evidence is missing.
      const baseP = clamp01(storyline.pCurve(t) + jitter(rng, 0.08));

      // Missing data should decrement effective P slightly (regression toward a low prior).
      const prior = 0.06;
      const evidenceWeight = clamp01(1 - missingPenalty * 0.35);
      const targetP = clamp01(baseP * evidenceWeight + prior * (1 - evidenceWeight));

      // Smooth it: real systems don't redraw perfectly straight lines.
      const p = clamp01(smoothStep(prevP, targetP, 0.55) + jitter(rng, 0.03));
      prevP = p;

      // Severity can diverge from P: high severity with stale/missing evidence (governance hold),
      // or moderate severity even when P is high (strong evidence but low impact).
      const baseS = clamp01(storyline.sCurve(t) + 0.35 * p + jitter(rng, 0.06));
      const severityFromEvidence = clamp01(0.15 + (present / Math.max(1, PILLAR_NAMES.length)) * 0.55 + conflict * 0.15);
      const targetS = clamp01(0.55 * baseS + 0.45 * severityFromEvidence + stalenessPenalty * 0.12 - missingPenalty * 0.08);
      const s = clamp01(smoothStep(prevS, targetS, 0.5) + jitter(rng, 0.03));
      prevS = s;

      // Confidence is mostly about evidence coverage, freshness, and consistency — NOT just t.
      // This is where you get "same P, bad C/S" and vice versa.
      const baseC = clamp01(0.85 - missingPenalty * 0.75 - stalenessPenalty * 0.55 - conflict * 0.25 + jitter(rng, 0.05));
      const c = clamp01(baseC - Math.max(0, s - 0.8) * 0.08); // extremely high severity reduces confidence slightly (risk of overfit)

      allSnapshots.push({
        id: uuidv4(),
        vin_id: vin.id,
        p_score: Math.round(p * 1000) / 1000,
        c_score: Math.round(c * 1000) / 1000,
        s_score: Math.round(s * 1000) / 1000,
        risk_band: getRiskBand(p),
        pillar_vector: vector,
        frame_index: f,
        computed_at: computedAt,
      });
    }

    const last = allSnapshots.filter((s) => s.vin_id === vin.id).at(-1);
    const lastEventAt = new Date(Math.max(...allEvents.filter((e) => e.vin_id === vin.id).map((e) => e.occurred_at.getTime()), startTime));

    if (last) {
      vinUpdates.push({
        vin_id: vin.id,
        posterior_p: last.p_score,
        posterior_c: last.c_score,
        posterior_s: last.s_score,
        risk_band: last.risk_band,
        last_event_at: lastEventAt,
      });
    }
  }

  return { events: allEvents, snapshots: allSnapshots, vinUpdates };
}
