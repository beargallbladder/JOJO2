const RISK_GRADIENT: [number, string][] = [
  [0.0, '#2563EB'],
  [0.1, '#3B82F6'],
  [0.2, '#06B6D4'],
  [0.3, '#10B981'],
  [0.4, '#22C55E'],
  [0.5, '#84CC16'],
  [0.6, '#EAB308'],
  [0.7, '#F59E0B'],
  [0.8, '#EF4444'],
  [0.9, '#DC2626'],
  [1.0, '#DC2626'],
];

export function riskColor(p: number): string {
  const clamped = Math.max(0, Math.min(1, p));
  for (let i = 1; i < RISK_GRADIENT.length; i++) {
    if (clamped <= RISK_GRADIENT[i][0]) {
      return RISK_GRADIENT[i][1];
    }
  }
  return RISK_GRADIENT[RISK_GRADIENT.length - 1][1];
}

export function riskBandClass(band: string): string {
  switch (band) {
    case 'critical': return 'glow-critical text-risk-critical';
    case 'high': return 'glow-high text-risk-high';
    case 'medium': return 'glow-medium text-risk-medium';
    case 'low': return 'glow-low text-risk-low';
    default: return '';
  }
}

export function riskBorderClass(band: string): string {
  switch (band) {
    case 'critical': return 'border-glow-critical';
    case 'high': return 'border-glow-high';
    case 'medium': return 'border-glow-medium';
    case 'low': return 'border-glow-low';
    default: return '';
  }
}
