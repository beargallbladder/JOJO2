export const PILLARS = {
  short_trip_density: { label: 'Short-Trip Density', letter: 'A', description: 'Ratio of trips < 20 min to total trips (30-day rolling)' },
  ota_stress: { label: 'OTA Power-Cycle Stress', letter: 'B', description: 'OTA frequency and parasitic power-cycle count (60-day rolling)' },
  cold_soak: { label: 'Cold-Soak Exposure', letter: 'C', description: 'Cumulative hours below −10°C in parked state' },
  cranking_degradation: { label: 'Cranking Degradation', letter: 'D', description: 'Cranking current slope and voltage stabilization time-to-target (90-day rolling)' },
  hmi_reset: { label: 'HMI Reset Event', letter: 'E', description: 'User-initiated maintenance reset (weighted evidence, not confirmation)' },
  service_record: { label: 'Service Record', letter: 'F', description: 'Dealer repair order presence in DMS (±14-day window)' },
  parts_purchase: { label: 'Parts Purchase', letter: 'G', description: 'Parts search/purchase correlated to VIN owner (±21-day window)' },
  cohort_prior: { label: 'Cohort Prior', letter: 'H', description: 'YMM-region failure distribution at equivalent mileage/age' },
} as const;

export type PillarName = keyof typeof PILLARS;
export const PILLAR_NAMES = Object.keys(PILLARS) as PillarName[];

export const SUBSYSTEM_PILLARS: Record<string, PillarName[]> = {
  battery_12v: ['short_trip_density', 'ota_stress', 'cold_soak', 'cranking_degradation', 'cohort_prior'],
  oil_maintenance: ['hmi_reset', 'short_trip_density', 'cranking_degradation', 'service_record', 'parts_purchase', 'cohort_prior'],
  brake_wear: ['short_trip_density', 'cranking_degradation', 'service_record', 'cohort_prior'],
};

export const SUBSYSTEM_N_EXPECTED: Record<string, number> = {
  battery_12v: 5,
  oil_maintenance: 6,
  brake_wear: 4,
};
