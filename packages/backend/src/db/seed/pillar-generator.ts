import { v4 as uuidv4 } from 'uuid';
import type { GeneratedVin } from './vin-generator.js';

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
  pillar_name: string;
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
  pillar_vector: Record<string, string>;
  frame_index: number;
  computed_at: Date;
}

function getRiskBand(p: number): 'critical' | 'high' | 'medium' | 'low' {
  if (p >= 0.8) return 'critical';
  if (p >= 0.6) return 'high';
  if (p >= 0.3) return 'medium';
  return 'low';
}

export function generatePillarData(vins: GeneratedVin[]) {
  const allEvents: GeneratedPillarEvent[] = [];
  const allSnapshots: GeneratedSnapshot[] = [];
  const now = new Date();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (const vin of vins) {
    const rng = mulberry32(vin.vin_code.charCodeAt(0) * 1000 + vin.vin_code.charCodeAt(10));
    const storyline = vin.storyline;
    const eventCount = 5 + Math.floor(rng() * 25); // 5-30 events
    const frameCount = 8 + Math.floor(rng() * 8); // 8-15 timeline frames
    const startTime = now.getTime() - ninetyDaysMs;

    // Generate pillar events
    for (let i = 0; i < eventCount; i++) {
      const t = i / eventCount;
      const pillarName = storyline.pillarPattern[Math.floor(rng() * storyline.pillarPattern.length)];
      const state: 'present' | 'absent' | 'unknown' = rng() < 0.7 ? 'present' : rng() < 0.5 ? 'absent' : 'unknown';

      allEvents.push({
        id: uuidv4(),
        vin_id: vin.id,
        pillar_name: pillarName,
        pillar_state: state,
        confidence: Math.round((0.3 + rng() * 0.7) * 100) / 100,
        evidence_source: EVIDENCE_SOURCES[Math.floor(rng() * EVIDENCE_SOURCES.length)],
        occurred_at: new Date(startTime + t * ninetyDaysMs),
        metadata: { auto_generated: true, storyline: storyline.id },
      });
    }

    // Generate posterior snapshots (timeline frames)
    for (let f = 0; f < frameCount; f++) {
      const t = f / (frameCount - 1);
      const p = Math.round(storyline.pCurve(t) * 1000) / 1000;
      const c = Math.round(storyline.cCurve(t) * 1000) / 1000;
      const s = Math.round(storyline.sCurve(t) * 1000) / 1000;

      const vector: Record<string, string> = {};
      for (const pillar of storyline.pillarPattern) {
        vector[pillar] = rng() < (0.3 + t * 0.5) ? 'present' : rng() < 0.3 ? 'absent' : 'unknown';
      }

      allSnapshots.push({
        id: uuidv4(),
        vin_id: vin.id,
        p_score: p,
        c_score: c,
        s_score: s,
        risk_band: getRiskBand(p),
        pillar_vector: vector,
        frame_index: f,
        computed_at: new Date(startTime + t * ninetyDaysMs),
      });
    }
  }

  return { events: allEvents, snapshots: allSnapshots };
}
