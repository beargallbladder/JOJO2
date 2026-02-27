export const PILLARS = {
  dtc_history: { label: 'DTC History', color: '#F97316', description: 'Diagnostic trouble codes' },
  recall_status: { label: 'Recall Status', color: '#EF4444', description: 'Open recalls' },
  service_history: { label: 'Service History', color: '#22C55E', description: 'Maintenance records' },
  warranty_claims: { label: 'Warranty Claims', color: '#3B82F6', description: 'Warranty activity' },
  tsb_applicability: { label: 'TSB Applicability', color: '#A78BFA', description: 'Technical service bulletins' },
  field_reports: { label: 'Field Reports', color: '#EC4899', description: 'Field incident reports' },
  telematics: { label: 'Telematics', color: '#06B6D4', description: 'Connected vehicle data' },
  inspection_results: { label: 'Inspection Results', color: '#84CC16', description: 'Inspection findings' },
} as const;

export type PillarName = keyof typeof PILLARS;
export const PILLAR_NAMES = Object.keys(PILLARS) as PillarName[];
