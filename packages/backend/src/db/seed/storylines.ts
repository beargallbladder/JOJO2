export interface Storyline {
  id: number;
  name: string;
  description: string;
  pCurve: (t: number) => number;
  cCurve: (t: number) => number;
  sCurve: (t: number) => number;
  pillarPattern: string[];
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export const STORYLINES: Storyline[] = [
  {
    id: 1, name: 'Gradual Degradation',
    description: 'Pillars accumulate over 60 days, P rises steadily',
    pCurve: (t) => clamp(t * 0.85),
    cCurve: (t) => clamp(0.3 + t * 0.5),
    sCurve: (t) => clamp(0.2 + t * 0.3),
    pillarPattern: ['short_trip_density', 'cranking_degradation', 'cold_soak', 'cohort_prior'],
  },
  {
    id: 2, name: 'Sudden Alert',
    description: 'Single critical event spikes P from 0.2 to 0.85',
    pCurve: (t) => t < 0.6 ? clamp(0.15 + t * 0.1) : clamp(0.85 - (t - 0.6) * 0.1),
    cCurve: (t) => t < 0.6 ? 0.3 : clamp(0.8 + (t - 0.6) * 0.2),
    sCurve: (t) => t < 0.6 ? 0.2 : clamp(0.7),
    pillarPattern: ['cranking_degradation', 'cold_soak'],
  },
  {
    id: 3, name: 'Absence → Rebound',
    description: 'Missing service record drops P, then parts purchase rebounds it',
    pCurve: (t) => t < 0.3 ? clamp(0.6 - t * 0.8) : t < 0.6 ? clamp(0.35 + (t - 0.3) * 1.5) : clamp(0.8),
    cCurve: (t) => t < 0.3 ? 0.4 : clamp(0.4 + (t - 0.3) * 0.7),
    sCurve: (t) => clamp(0.5 + t * 0.3),
    pillarPattern: ['service_record', 'hmi_reset', 'cranking_degradation', 'parts_purchase', 'cohort_prior'],
  },
  {
    id: 4, name: 'Stale Hold',
    description: 'P high but S also high, governance holds action',
    pCurve: (t) => clamp(0.7 + t * 0.1),
    cCurve: (t) => clamp(0.6 + t * 0.2),
    sCurve: (t) => clamp(0.7 + t * 0.15),
    pillarPattern: ['short_trip_density', 'hmi_reset', 'ota_stress'],
  },
  {
    id: 5, name: 'Multi-Pillar Convergence',
    description: '4+ pillars present simultaneously, escalation',
    pCurve: (t) => clamp(0.3 + t * 0.6),
    cCurve: (t) => clamp(0.5 + t * 0.4),
    sCurve: (t) => clamp(0.3 + t * 0.4),
    pillarPattern: ['short_trip_density', 'cranking_degradation', 'service_record', 'parts_purchase', 'cold_soak', 'cohort_prior'],
  },
  {
    id: 6, name: 'False Suppression',
    description: 'Suppressed then contradicted by reappearance',
    pCurve: (t) => t < 0.4 ? clamp(0.6) : t < 0.6 ? clamp(0.3) : clamp(0.75),
    cCurve: (t) => t < 0.4 ? 0.5 : t < 0.6 ? 0.3 : clamp(0.7),
    sCurve: (t) => clamp(0.4),
    pillarPattern: ['short_trip_density', 'cold_soak', 'cranking_degradation'],
  },
  {
    id: 7, name: 'Slow Recovery',
    description: 'Was critical, now declining as repairs confirmed',
    pCurve: (t) => clamp(0.9 - t * 0.6),
    cCurve: (t) => clamp(0.5 + t * 0.3),
    sCurve: (t) => clamp(0.7 - t * 0.4),
    pillarPattern: ['service_record', 'parts_purchase', 'cohort_prior'],
  },
  {
    id: 8, name: 'Intermittent Flicker',
    description: 'Pillar appears/disappears creating uncertainty',
    pCurve: (t) => clamp(0.4 + Math.sin(t * Math.PI * 4) * 0.2),
    cCurve: (t) => clamp(0.3 + Math.sin(t * Math.PI * 3) * 0.15),
    sCurve: (t) => clamp(0.35),
    pillarPattern: ['short_trip_density', 'cold_soak'],
  },
  {
    id: 9, name: 'New Vehicle Baseline',
    description: 'Recent purchase, minimal history, low P',
    pCurve: (t) => clamp(0.05 + t * 0.1),
    cCurve: (t) => clamp(0.2 + t * 0.1),
    sCurve: (t) => clamp(0.1),
    pillarPattern: ['cold_soak'],
  },
  {
    id: 10, name: 'Fleet Outlier',
    description: 'Statistically unusual vs fleet peers',
    pCurve: (t) => clamp(0.5 + Math.sin(t * Math.PI * 2) * 0.3),
    cCurve: (t) => clamp(0.6),
    sCurve: (t) => clamp(0.5 + t * 0.2),
    pillarPattern: ['short_trip_density', 'service_record', 'cold_soak', 'cranking_degradation'],
  },
];
