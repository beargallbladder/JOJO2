export interface Storyline {
  id: number;
  name: string;
  description: string;
  pCurve: (t: number) => number; // t in [0,1] over 90 days
  cCurve: (t: number) => number;
  sCurve: (t: number) => number;
  pillarPattern: string[]; // which pillars activate and when
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export const STORYLINES: Storyline[] = [
  {
    id: 1, name: 'Gradual Degradation',
    description: 'Pillars accumulate over 60 days, P rises steadily',
    pCurve: (t) => clamp(t * 0.85),
    cCurve: (t) => clamp(0.3 + t * 0.5),
    sCurve: (t) => clamp(0.2 + t * 0.3),
    pillarPattern: ['dtc_history', 'service_history', 'telematics', 'warranty_claims'],
  },
  {
    id: 2, name: 'Sudden Alert',
    description: 'Single critical pillar event spikes P from 0.2 to 0.85',
    pCurve: (t) => t < 0.6 ? clamp(0.15 + t * 0.1) : clamp(0.85 - (t - 0.6) * 0.1),
    cCurve: (t) => t < 0.6 ? 0.3 : clamp(0.8 + (t - 0.6) * 0.2),
    sCurve: (t) => t < 0.6 ? 0.2 : clamp(0.7),
    pillarPattern: ['recall_status', 'field_reports'],
  },
  {
    id: 3, name: 'Absence → Rebound',
    description: 'Missing service record, P dips, then rebounds with evidence',
    pCurve: (t) => t < 0.3 ? clamp(0.6 - t * 0.8) : t < 0.6 ? clamp(0.35 + (t - 0.3) * 1.5) : clamp(0.8),
    cCurve: (t) => t < 0.3 ? 0.4 : clamp(0.4 + (t - 0.3) * 0.7),
    sCurve: (t) => clamp(0.5 + t * 0.3),
    pillarPattern: ['service_history', 'dtc_history', 'telematics', 'inspection_results', 'warranty_claims'],
  },
  {
    id: 4, name: 'Stale Hold',
    description: 'P high but S also high, governance holds action',
    pCurve: (t) => clamp(0.7 + t * 0.1),
    cCurve: (t) => clamp(0.6 + t * 0.2),
    sCurve: (t) => clamp(0.7 + t * 0.15),
    pillarPattern: ['dtc_history', 'recall_status', 'tsb_applicability'],
  },
  {
    id: 5, name: 'Multi-Pillar Convergence',
    description: '4+ pillars present simultaneously, escalation',
    pCurve: (t) => clamp(0.3 + t * 0.6),
    cCurve: (t) => clamp(0.5 + t * 0.4),
    sCurve: (t) => clamp(0.3 + t * 0.4),
    pillarPattern: ['dtc_history', 'recall_status', 'service_history', 'warranty_claims', 'tsb_applicability', 'field_reports'],
  },
  {
    id: 6, name: 'False Suppression',
    description: 'Suppressed then contradicted by reappearance',
    pCurve: (t) => t < 0.4 ? clamp(0.6) : t < 0.6 ? clamp(0.3) : clamp(0.75),
    cCurve: (t) => t < 0.4 ? 0.5 : t < 0.6 ? 0.3 : clamp(0.7),
    sCurve: (t) => clamp(0.4),
    pillarPattern: ['dtc_history', 'telematics', 'field_reports'],
  },
  {
    id: 7, name: 'Slow Recovery',
    description: 'Was critical, now declining as repairs confirmed',
    pCurve: (t) => clamp(0.9 - t * 0.6),
    cCurve: (t) => clamp(0.5 + t * 0.3),
    sCurve: (t) => clamp(0.7 - t * 0.4),
    pillarPattern: ['service_history', 'inspection_results', 'warranty_claims'],
  },
  {
    id: 8, name: 'Intermittent Flicker',
    description: 'Pillar appears/disappears creating uncertainty',
    pCurve: (t) => clamp(0.4 + Math.sin(t * Math.PI * 4) * 0.2),
    cCurve: (t) => clamp(0.3 + Math.sin(t * Math.PI * 3) * 0.15),
    sCurve: (t) => clamp(0.35),
    pillarPattern: ['dtc_history', 'telematics'],
  },
  {
    id: 9, name: 'New Vehicle Baseline',
    description: 'Recent purchase, minimal history, low P',
    pCurve: (t) => clamp(0.05 + t * 0.1),
    cCurve: (t) => clamp(0.2 + t * 0.1),
    sCurve: (t) => clamp(0.1),
    pillarPattern: ['telematics'],
  },
  {
    id: 10, name: 'Fleet Outlier',
    description: 'Statistically unusual vs fleet peers',
    pCurve: (t) => clamp(0.5 + Math.sin(t * Math.PI * 2) * 0.3),
    cCurve: (t) => clamp(0.6),
    sCurve: (t) => clamp(0.5 + t * 0.2),
    pillarPattern: ['dtc_history', 'service_history', 'telematics', 'field_reports'],
  },
];
