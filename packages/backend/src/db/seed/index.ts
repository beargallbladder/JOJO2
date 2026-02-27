import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schema.js';
import { generateVins } from './vin-generator.js';
import { generatePillarData } from './pillar-generator.js';
import { generateDealers } from './dealer-generator.js';
import { count, sql } from 'drizzle-orm';

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gravity_leads';
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool, { schema });
  const force = process.env.FORCE_SEED === '1';

  console.log('🌱 Starting seed...');

  const existing = await db.select({ count: count() }).from(schema.vins);
  const existingCount = Number(existing[0]?.count ?? 0);

  if (existingCount > 0 && !force) {
    console.log(`  Database already seeded (vins=${existingCount}). Skipping.`);
    await pool.end();
    return;
  }

  if (force) {
    console.log('  FORCE_SEED=1: clearing existing data...');
    await db.execute(
      sql`TRUNCATE booking_drafts, vin_preferences, fsr_slots, governance_actions, memory_records, posterior_snapshots, pillar_events, vins, dealer_directory CASCADE`,
    );
  }

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
