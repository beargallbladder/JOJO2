export const SUBSYSTEMS = {
  propulsion: { label: 'Propulsion', shortLabel: 'P', color: '#F59E0B' },
  chassis: { label: 'Chassis', shortLabel: 'C', color: '#A78BFA' },
  safety: { label: 'Safety', shortLabel: 'S', color: '#2DD4BF' },
} as const;

export const SUBSYSTEM_LIST = ['propulsion', 'chassis', 'safety'] as const;
