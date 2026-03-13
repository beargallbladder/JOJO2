export interface Vin {
  id: string;
  vin_code: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  subsystem: Subsystem;
  posterior_p: number;
  posterior_c: number;
  posterior_s: number;
  risk_band: RiskBand;
  governance_band: GovernanceBand;
  governance_reason: string;
  home_area: string | null;
  last_event_at: string;
  created_at: string;
  updated_at: string;
}

export type RiskBand = 'critical' | 'high' | 'medium' | 'low';
export type Subsystem = 'battery_12v' | 'oil_maintenance' | 'brake_wear';
export type GovernanceBand = 'ESCALATED' | 'MONITOR' | 'SUPPRESSED';

export interface PillarEvent {
  id: string;
  vin_id: string;
  pillar_name: string;
  pillar_state: PillarState;
  confidence: number;
  evidence_source: string;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

export type PillarState = 'present' | 'absent' | 'unknown';

export interface PosteriorSnapshot {
  id: string;
  vin_id: string;
  p_score: number;
  c_score: number;
  s_score: number;
  risk_band: RiskBand;
  governance_band: GovernanceBand;
  governance_reason: string;
  pillar_vector: Record<string, PillarState>;
  frame_index: number;
  computed_at: string;
}

export interface SortContext {
  schema_version: string;
  as_of: string;
  vas: number;
  esc: number;
  tsi: number;
  stale: boolean;
}
