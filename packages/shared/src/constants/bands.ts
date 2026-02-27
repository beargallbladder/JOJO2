export const RISK_BANDS = {
  critical: { min: 0.8, max: 1.0, label: 'Critical', color: '#EF4444' },
  high: { min: 0.6, max: 0.8, label: 'High', color: '#EAB308' },
  medium: { min: 0.3, max: 0.6, label: 'Medium', color: '#22C55E' },
  low: { min: 0.0, max: 0.3, label: 'Low', color: '#3B82F6' },
} as const;

export const RISK_BAND_ORDER = ['critical', 'high', 'medium', 'low'] as const;
