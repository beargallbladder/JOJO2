export const SUBSYSTEMS = {
  battery_12v: { label: 'Battery 12V', shortLabel: '12V', color: '#F59E0B' },
  oil_maintenance: { label: 'Oil Maintenance', shortLabel: 'OIL', color: '#A78BFA' },
  brake_wear: { label: 'Brake Wear', shortLabel: 'BRK', color: '#2DD4BF' },
} as const;

export type SubsystemId = keyof typeof SUBSYSTEMS;
export const SUBSYSTEM_LIST = Object.keys(SUBSYSTEMS) as SubsystemId[];
