export interface Vin {
  id: string; // UUID
  vin_code: string; // 17-char VIN string
  year: number;
  make: string;
  model: string;
  trim: string;
  subsystem: Subsystem;
  posterior_p: number; // 0-1 probability
  posterior_c: number; // confidence 0-1
  posterior_s: number; // severity 0-1
  risk_band: RiskBand;
  home_area: string | null; // postal prefix for privacy
  last_event_at: string; // ISO date
  created_at: string;
  updated_at: string;
}

export type RiskBand = 'critical' | 'high' | 'medium' | 'low';
export type Subsystem = 'propulsion' | 'chassis' | 'safety';

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
  pillar_vector: Record<string, PillarState>;
  frame_index: number;
  computed_at: string;
}
