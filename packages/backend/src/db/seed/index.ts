import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema.js';
import { generateVins } from './vin-generator.js';
import { generatePillarData } from './pillar-generator.js';
import { generateDealers } from './dealer-generator.js';
import { sql } from 'drizzle-orm';

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gravity_leads';
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('🌱 Starting seed...');

  // Create enums and tables if they don't exist
  console.log('  Creating schema...');
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE risk_band AS ENUM ('critical', 'high', 'medium', 'low');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE subsystem AS ENUM ('propulsion', 'chassis', 'safety');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE pillar_state AS ENUM ('present', 'absent', 'unknown');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE booking_status AS ENUM ('draft', 'held', 'exported');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vin_code TEXT NOT NULL UNIQUE,
      year INTEGER NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      trim TEXT NOT NULL,
      subsystem subsystem NOT NULL,
      posterior_p REAL NOT NULL DEFAULT 0,
      posterior_c REAL NOT NULL DEFAULT 0,
      posterior_s REAL NOT NULL DEFAULT 0,
      risk_band risk_band NOT NULL DEFAULT 'low',
      home_area TEXT,
      last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS pillar_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vin_id UUID NOT NULL REFERENCES vins(id),
      pillar_name TEXT NOT NULL,
      pillar_state pillar_state NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.5,
      evidence_source TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL,
      metadata JSONB DEFAULT '{}'
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS posterior_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vin_id UUID NOT NULL REFERENCES vins(id),
      p_score REAL NOT NULL,
      c_score REAL NOT NULL,
      s_score REAL NOT NULL,
      risk_band risk_band NOT NULL,
      pillar_vector JSONB DEFAULT '{}',
      frame_index INTEGER NOT NULL,
      computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS governance_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vin_id UUID NOT NULL REFERENCES vins(id),
      action_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      triggered_by TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS memory_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vin_id UUID NOT NULL REFERENCES vins(id),
      record_type TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS dealer_directory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      metro_area TEXT NOT NULL,
      postal_prefix TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      capabilities JSONB DEFAULT '[]',
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS vin_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vin_id UUID NOT NULL REFERENCES vins(id) UNIQUE,
      home_area TEXT,
      preferred_dealer_id UUID REFERENCES dealer_directory(id),
      use_preferred_first INTEGER NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS fsr_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dealer_id UUID NOT NULL REFERENCES dealer_directory(id),
      date TEXT NOT NULL,
      time_block TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 2,
      booked INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS booking_drafts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vin_id UUID NOT NULL REFERENCES vins(id),
      dealer_id UUID NOT NULL REFERENCES dealer_directory(id),
      slot_id UUID NOT NULL REFERENCES fsr_slots(id),
      status booking_status NOT NULL DEFAULT 'draft',
      reason TEXT NOT NULL,
      contact JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Clear existing data
  console.log('  Clearing existing data...');
  await db.execute(sql`TRUNCATE booking_drafts, vin_preferences, fsr_slots, governance_actions, memory_records, posterior_snapshots, pillar_events, vins, dealer_directory CASCADE`);

  // Generate dealers first (no FK deps)
  console.log('  Generating 50 dealers + FSR slots...');
  const { dealers, slots } = generateDealers();

  for (const dealer of dealers) {
    await db.insert(schema.dealerDirectory).values({
      id: dealer.id,
      name: dealer.name,
      code: dealer.code,
      metro_area: dealer.metro_area,
      postal_prefix: dealer.postal_prefix,
      address: dealer.address,
      phone: dealer.phone,
      capabilities: dealer.capabilities,
      latitude: dealer.latitude,
      longitude: dealer.longitude,
    });
  }

  // Batch insert slots
  const BATCH = 100;
  for (let i = 0; i < slots.length; i += BATCH) {
    const batch = slots.slice(i, i + BATCH);
    await db.insert(schema.fsrSlots).values(batch.map(s => ({
      id: s.id,
      dealer_id: s.dealer_id,
      date: s.date,
      time_block: s.time_block,
      capacity: s.capacity,
      booked: s.booked,
    })));
  }
  console.log(`  Inserted ${dealers.length} dealers, ${slots.length} slots`);

  // Generate VINs
  console.log('  Generating 500 VINs...');
  const generatedVins = generateVins(500);

  for (let i = 0; i < generatedVins.length; i += BATCH) {
    const batch = generatedVins.slice(i, i + BATCH);
    await db.insert(schema.vins).values(batch.map(v => ({
      id: v.id,
      vin_code: v.vin_code,
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      subsystem: v.subsystem,
      posterior_p: v.posterior_p,
      posterior_c: v.posterior_c,
      posterior_s: v.posterior_s,
      risk_band: v.risk_band,
      home_area: v.home_area,
      last_event_at: v.last_event_at,
    })));
  }
  console.log(`  Inserted ${generatedVins.length} VINs`);

  // Generate pillar data
  console.log('  Generating pillar events + snapshots...');
  const { events, snapshots } = generatePillarData(generatedVins);

  for (let i = 0; i < events.length; i += BATCH) {
    const batch = events.slice(i, i + BATCH);
    await db.insert(schema.pillarEvents).values(batch.map(e => ({
      id: e.id,
      vin_id: e.vin_id,
      pillar_name: e.pillar_name,
      pillar_state: e.pillar_state,
      confidence: e.confidence,
      evidence_source: e.evidence_source,
      occurred_at: e.occurred_at,
      metadata: e.metadata,
    })));
  }

  for (let i = 0; i < snapshots.length; i += BATCH) {
    const batch = snapshots.slice(i, i + BATCH);
    await db.insert(schema.posteriorSnapshots).values(batch.map(s => ({
      id: s.id,
      vin_id: s.vin_id,
      p_score: s.p_score,
      c_score: s.c_score,
      s_score: s.s_score,
      risk_band: s.risk_band,
      pillar_vector: s.pillar_vector,
      frame_index: s.frame_index,
      computed_at: s.computed_at,
    })));
  }
  console.log(`  Inserted ${events.length} pillar events, ${snapshots.length} snapshots`);

  // Generate governance actions for high/critical VINs
  console.log('  Generating governance actions...');
  const govActions = generatedVins
    .filter(v => v.risk_band === 'critical' || v.risk_band === 'high')
    .map(v => {
      const actions: { action_type: string; reason: string; triggered_by: string }[] = [];
      if (v.posterior_p >= 0.8) {
        actions.push({ action_type: 'recommend_service', reason: `P-score ${v.posterior_p} exceeds critical threshold`, triggered_by: 'posterior_engine' });
      }
      if (v.storyline.id === 4) {
        actions.push({ action_type: 'hold', reason: 'High severity score prevents auto-scheduling', triggered_by: 'governance_rules' });
      }
      if (v.storyline.id === 5) {
        actions.push({ action_type: 'escalate', reason: 'Multi-pillar convergence detected', triggered_by: 'convergence_detector' });
      }
      return actions.map(a => ({
        id: crypto.randomUUID(),
        vin_id: v.id,
        ...a,
        metadata: { storyline: v.storyline.id },
      }));
    })
    .flat();

  for (let i = 0; i < govActions.length; i += BATCH) {
    const batch = govActions.slice(i, i + BATCH);
    await db.insert(schema.governanceActions).values(batch);
  }
  console.log(`  Inserted ${govActions.length} governance actions`);

  console.log('✅ Seed complete!');
  console.log(`  VINs: ${generatedVins.length}`);
  console.log(`  Dealers: ${dealers.length}`);
  console.log(`  FSR Slots: ${slots.length}`);
  console.log(`  Pillar Events: ${events.length}`);
  console.log(`  Snapshots: ${snapshots.length}`);
  console.log(`  Governance: ${govActions.length}`);

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
