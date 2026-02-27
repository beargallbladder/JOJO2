import { v4 as uuidv4 } from 'uuid';
import { STORYLINES } from './storylines.js';

// Seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string to numeric seed
function strToSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

const SEED = 'gravity-lead-demo-v1';
const random = mulberry32(strToSeed(SEED));

const MAKES_MODELS = [
  { make: 'Ford', models: [
    { model: 'F-150', trims: ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum'] },
    { model: 'F-250', trims: ['XL', 'XLT', 'Lariat', 'King Ranch'] },
    { model: 'Explorer', trims: ['Base', 'XLT', 'Limited', 'ST'] },
    { model: 'Escape', trims: ['S', 'SE', 'SEL', 'Titanium'] },
    { model: 'Bronco', trims: ['Base', 'Big Bend', 'Outer Banks', 'Wildtrak'] },
    { model: 'Mustang Mach-E', trims: ['Select', 'Premium', 'GT'] },
    { model: 'Transit', trims: ['Cargo', 'Crew', 'Passenger'] },
    { model: 'Ranger', trims: ['XL', 'XLT', 'Lariat'] },
  ]},
];

const SUBSYSTEMS = ['propulsion', 'chassis', 'safety'] as const;
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];
const POSTAL_PREFIXES = ['481', '606', '770', '900', '331', '752', '850', '981'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function genVinCode(index: number): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let code = '1FT';
  for (let i = 0; i < 11; i++) {
    code += chars[Math.floor(random() * chars.length)];
  }
  // Last 3 are sequential for uniqueness
  const seq = index.toString().padStart(3, '0');
  return code.slice(0, 14) + seq;
}

function getRiskBand(p: number): 'critical' | 'high' | 'medium' | 'low' {
  if (p >= 0.8) return 'critical';
  if (p >= 0.6) return 'high';
  if (p >= 0.3) return 'medium';
  return 'low';
}

// Distribution: 20% critical, 25% high, 30% medium, 25% low
function assignStoryline(index: number): typeof STORYLINES[number] {
  const r = random();
  // Critical VINs (storylines 2,4,5)
  if (r < 0.20) return pick([STORYLINES[1], STORYLINES[3], STORYLINES[4]]);
  // High (storylines 1,3,6,10)
  if (r < 0.45) return pick([STORYLINES[0], STORYLINES[2], STORYLINES[5], STORYLINES[9]]);
  // Medium (storylines 7,8)
  if (r < 0.75) return pick([STORYLINES[6], STORYLINES[7]]);
  // Low (storyline 9)
  return STORYLINES[8];
}

export interface GeneratedVin {
  id: string;
  vin_code: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  subsystem: typeof SUBSYSTEMS[number];
  posterior_p: number;
  posterior_c: number;
  posterior_s: number;
  risk_band: 'critical' | 'high' | 'medium' | 'low';
  home_area: string;
  storyline: typeof STORYLINES[number];
  last_event_at: Date;
}

// Hero VINs
const HERO_VINS = [
  { index: 0, vinCode: '1FTEW1E5XMFHERO1', storylineId: 3 },
  { index: 1, vinCode: '1FTEW1E5XMFHERO2', storylineId: 4 },
  { index: 2, vinCode: '1FTEW1E5XMFHERO3', storylineId: 5 },
];

export function generateVins(count: number = 500): GeneratedVin[] {
  const vins: GeneratedVin[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const hero = HERO_VINS.find(h => h.index === i);
    const storyline = hero ? STORYLINES[hero.storylineId - 1] : assignStoryline(i);
    const makeEntry = MAKES_MODELS[0];
    const modelEntry = pick(makeEntry.models);
    const finalP = storyline.pCurve(1);
    const finalC = storyline.cCurve(1);
    const finalS = storyline.sCurve(1);

    vins.push({
      id: uuidv4(),
      vin_code: hero ? hero.vinCode : genVinCode(i),
      year: pick(YEARS),
      make: makeEntry.make,
      model: modelEntry.model,
      trim: pick(modelEntry.trims),
      subsystem: pick([...SUBSYSTEMS]),
      posterior_p: Math.round(finalP * 1000) / 1000,
      posterior_c: Math.round(finalC * 1000) / 1000,
      posterior_s: Math.round(finalS * 1000) / 1000,
      risk_band: getRiskBand(finalP),
      home_area: pick(POSTAL_PREFIXES),
      storyline,
      last_event_at: new Date(now.getTime() - random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  return vins;
}
