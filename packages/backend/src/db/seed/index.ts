import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { execSync } from 'node:child_process';
import * as schema from '../schema.js';
import { generateVins } from './vin-generator.js';
import { generatePillarData } from './pillar-generator.js';
import { generateDealers } from './dealer-generator.js';
import { count, eq, sql } from 'drizzle-orm';

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gravity_leads';
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool, { schema });
  const force = process.env.FORCE_SEED === '1';

  console.log('🌱 Starting seed...');

  if (!force) {
    try {
      const existing = await db.select({ count: count() }).from(schema.vins);
      const existingCount = Number(existing[0]?.count ?? 0);
      if (existingCount > 0) {
        console.log(`  Database already seeded (vins=${existingCount}). Skipping.`);
        await pool.end();
        return;
      }
    } catch {
      console.log('  vins table does not exist yet. Will create via migration.');
    }
  }

  if (force) {
    console.log('  FORCE_SEED=1: dropping all tables and enums for clean rebuild...');
    await db.execute(sql`
      DROP TABLE IF EXISTS booking_drafts CASCADE;
      DROP TABLE IF EXISTS vin_preferences CASCADE;
      DROP TABLE IF EXISTS fsr_slots CASCADE;
      DROP TABLE IF EXISTS governance_actions CASCADE;
      DROP TABLE IF EXISTS memory_records CASCADE;
      DROP TABLE IF EXISTS posterior_snapshots CASCADE;
      DROP TABLE IF EXISTS pillar_events CASCADE;
      DROP TABLE IF EXISTS vins CASCADE;
      DROP TABLE IF EXISTS dealer_directory CASCADE;
      DROP TABLE IF EXISTS __drizzle_migrations CASCADE;
      DROP TYPE IF EXISTS risk_band CASCADE;
      DROP TYPE IF EXISTS subsystem CASCADE;
      DROP TYPE IF EXISTS pillar_state CASCADE;
      DROP TYPE IF EXISTS booking_status CASCADE;
      DROP TYPE IF EXISTS governance_band CASCADE;
    `);

    console.log('  Creating schema from inline SQL...');
    await db.execute(sql.raw(`
      DO $$ BEGIN CREATE TYPE "public"."booking_status" AS ENUM('draft', 'held', 'exported'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE "public"."governance_band" AS ENUM('ESCALATED', 'MONITOR', 'SUPPRESSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE "public"."pillar_state" AS ENUM('present', 'absent', 'unknown'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE "public"."risk_band" AS ENUM('critical', 'high', 'medium', 'low'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE "public"."subsystem" AS ENUM('battery_12v', 'oil_maintenance', 'brake_wear'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      CREATE TABLE IF NOT EXISTS "dealer_directory" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, "code" text NOT NULL, "metro_area" text NOT NULL, "postal_prefix" text NOT NULL, "address" text NOT NULL, "phone" text NOT NULL, "capabilities" jsonb DEFAULT '[]'::jsonb, "latitude" real NOT NULL, "longitude" real NOT NULL, CONSTRAINT "dealer_directory_code_unique" UNIQUE("code"));
      CREATE TABLE IF NOT EXISTS "vins" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "vin_code" text NOT NULL, "year" integer NOT NULL, "make" text NOT NULL, "model" text NOT NULL, "trim" text NOT NULL, "subsystem" "subsystem" NOT NULL, "posterior_p" real DEFAULT 0 NOT NULL, "posterior_c" real DEFAULT 0 NOT NULL, "posterior_s" real DEFAULT 0 NOT NULL, "risk_band" "risk_band" DEFAULT 'low' NOT NULL, "governance_band" "governance_band" DEFAULT 'SUPPRESSED' NOT NULL, "governance_reason" text DEFAULT '' NOT NULL, "home_area" text, "last_event_at" timestamp with time zone DEFAULT now() NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "vins_vin_code_unique" UNIQUE("vin_code"));
      CREATE TABLE IF NOT EXISTS "pillar_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "vin_id" uuid NOT NULL REFERENCES "vins"("id"), "pillar_name" text NOT NULL, "pillar_state" "pillar_state" NOT NULL, "confidence" real DEFAULT 0.5 NOT NULL, "evidence_source" text NOT NULL, "occurred_at" timestamp with time zone NOT NULL, "metadata" jsonb DEFAULT '{}'::jsonb);
      CREATE TABLE IF NOT EXISTS "posterior_snapshots" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "vin_id" uuid NOT NULL REFERENCES "vins"("id"), "p_score" real NOT NULL, "c_score" real NOT NULL, "s_score" real NOT NULL, "risk_band" "risk_band" NOT NULL, "governance_band" "governance_band" DEFAULT 'SUPPRESSED' NOT NULL, "governance_reason" text DEFAULT '' NOT NULL, "pillar_vector" jsonb DEFAULT '{}'::jsonb, "frame_index" integer NOT NULL, "computed_at" timestamp with time zone DEFAULT now() NOT NULL);
      CREATE TABLE IF NOT EXISTS "governance_actions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "vin_id" uuid NOT NULL REFERENCES "vins"("id"), "action_type" text NOT NULL, "reason" text NOT NULL, "triggered_by" text NOT NULL, "metadata" jsonb DEFAULT '{}'::jsonb, "created_at" timestamp with time zone DEFAULT now() NOT NULL);
      CREATE TABLE IF NOT EXISTS "memory_records" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "vin_id" uuid NOT NULL REFERENCES "vins"("id"), "record_type" text NOT NULL, "content" text NOT NULL, "source" text NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL);
      CREATE TABLE IF NOT EXISTS "fsr_slots" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "dealer_id" uuid NOT NULL REFERENCES "dealer_directory"("id"), "date" text NOT NULL, "time_block" text NOT NULL, "capacity" integer DEFAULT 2 NOT NULL, "booked" integer DEFAULT 0 NOT NULL);
      CREATE TABLE IF NOT EXISTS "vin_preferences" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "vin_id" uuid NOT NULL REFERENCES "vins"("id") UNIQUE, "home_area" text, "preferred_dealer_id" uuid REFERENCES "dealer_directory"("id"), "use_preferred_first" integer DEFAULT 1 NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL);
      CREATE TABLE IF NOT EXISTS "booking_drafts" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "vin_id" uuid NOT NULL REFERENCES "vins"("id"), "dealer_id" uuid NOT NULL REFERENCES "dealer_directory"("id"), "slot_id" uuid NOT NULL REFERENCES "fsr_slots"("id"), "status" "booking_status" DEFAULT 'draft' NOT NULL, "reason" text NOT NULL, "contact" jsonb DEFAULT '{}'::jsonb, "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL);
    `));
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
  const { events, snapshots, vinUpdates } = generatePillarData(generatedVins);

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
      governance_band: s.governance_band,
      governance_reason: s.governance_reason,
      pillar_vector: s.pillar_vector,
      frame_index: s.frame_index,
      computed_at: s.computed_at,
    })));
  }
  console.log(`  Inserted ${events.length} pillar events, ${snapshots.length} snapshots`);

  // Align the VIN row with the last posterior snapshot so list + detail feel coherent.
  console.log('  Aligning VIN posterior fields to latest timeline frame...');
  for (let i = 0; i < vinUpdates.length; i += BATCH) {
    const batch = vinUpdates.slice(i, i + BATCH);
    for (const u of batch) {
      await db
        .update(schema.vins)
        .set({
          posterior_p: u.posterior_p,
          posterior_c: u.posterior_c,
          posterior_s: u.posterior_s,
          risk_band: u.risk_band,
          governance_band: u.governance_band,
          governance_reason: u.governance_reason,
          last_event_at: u.last_event_at,
          updated_at: new Date(),
        })
        .where(eq(schema.vins.id, u.vin_id));
    }
  }

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

  // Hand-crafted demo VINs for walkthrough scenarios.
  // These override the first 6 hero VINs with clean, spec-matching governance states.
  console.log('  Overwriting hero VINs with walkthrough-ready data...');
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);

  const heroOverrides = [
    {
      vin_code: '1FTEW1E5XMFHERO1',
      label: 'ESCALATED — all pillars present, fresh data',
      posterior_p: 0.91, posterior_c: 0.82, posterior_s: 0.12,
      risk_band: 'critical' as const, governance_band: 'ESCALATED' as const,
      governance_reason: 'High risk (91%) with strong evidence (82%) and fresh data. Dealer action warranted.',
      last_event_at: twoDaysAgo,
    },
    {
      vin_code: '1FTEW1E5XMFHERO2',
      label: 'SUPPRESSED — high P but low C (thin evidence)',
      posterior_p: 0.88, posterior_c: 0.33, posterior_s: 0.15,
      risk_band: 'critical' as const, governance_band: 'SUPPRESSED' as const,
      governance_reason: 'Not enough evidence to act (33% coverage). Need at least 50%.',
      last_event_at: twoDaysAgo,
    },
    {
      vin_code: '1FTEW1E5XMFHERO3',
      label: 'SUPPRESSED — high P, high C, but STALE',
      posterior_p: 0.88, posterior_c: 0.82, posterior_s: 0.78,
      risk_band: 'critical' as const, governance_band: 'SUPPRESSED' as const,
      governance_reason: 'Evidence is 50 days old — too stale to act on',
      last_event_at: fiftyDaysAgo,
    },
    {
      vin_code: '1FTEW1E5XMFHERO4',
      label: 'MONITOR — elevated risk, moderate evidence',
      posterior_p: 0.72, posterior_c: 0.65, posterior_s: 0.35,
      risk_band: 'high' as const, governance_band: 'MONITOR' as const,
      governance_reason: 'Elevated risk (72%) with moderate evidence (65%). Watching for more signal.',
      last_event_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      vin_code: '1FTEW1E5XMFHERO5',
      label: 'SUPPRESSED — gap zone, P and C both middling',
      posterior_p: 0.55, posterior_c: 0.52, posterior_s: 0.30,
      risk_band: 'medium' as const, governance_band: 'SUPPRESSED' as const,
      governance_reason: 'Risk is 55% but evidence is only 52% — not enough to escalate or monitor. Holding.',
      last_event_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      vin_code: '1FTEW1E5XMFHERO6',
      label: 'SUPPRESSED — low risk baseline',
      posterior_p: 0.12, posterior_c: 0.25, posterior_s: 0.08,
      risk_band: 'low' as const, governance_band: 'SUPPRESSED' as const,
      governance_reason: 'Risk level (12%) is below action threshold',
      last_event_at: thirtyDaysAgo,
    },
  ];

  for (const hero of heroOverrides) {
    await db.update(schema.vins).set({
      posterior_p: hero.posterior_p,
      posterior_c: hero.posterior_c,
      posterior_s: hero.posterior_s,
      risk_band: hero.risk_band,
      governance_band: hero.governance_band,
      governance_reason: hero.governance_reason,
      last_event_at: hero.last_event_at,
      updated_at: now,
    }).where(eq(schema.vins.vin_code, hero.vin_code));
  }
  console.log(`  Overwrote ${heroOverrides.length} hero VINs`);

  // Insert clean pillar events for HERO1 (ESCALATED) so constellation shows all pillars corroborating.
  const hero1 = generatedVins.find(v => v.vin_code === '1FTEW1E5XMFHERO1');
  if (hero1) {
    const hero1Pillars = ['short_trip_density', 'ota_stress', 'cold_soak', 'cranking_degradation', 'cohort_prior'];
    const sources = ['Vehicle telematics', 'OTA servers', 'Vehicle sensors', 'Onboard diagnostics', 'Fleet analytics'];
    for (let i = 0; i < hero1Pillars.length; i++) {
      await db.insert(schema.pillarEvents).values({
        vin_id: hero1.id,
        pillar_name: hero1Pillars[i],
        pillar_state: 'present',
        confidence: 0.85 + Math.random() * 0.10,
        evidence_source: sources[i],
        occurred_at: twoDaysAgo,
        metadata: { hero: true },
      });
    }
    console.log('  Inserted 5 corroborating pillar events for HERO1 (ESCALATED)');
  }

  // Insert pillar events for HERO2 (high P, low C) — only 1 pillar present, rest unknown.
  const hero2 = generatedVins.find(v => v.vin_code === '1FTEW1E5XMFHERO2');
  if (hero2) {
    await db.insert(schema.pillarEvents).values({
      vin_id: hero2.id,
      pillar_name: 'cranking_degradation',
      pillar_state: 'present',
      confidence: 0.90,
      evidence_source: 'Onboard diagnostics',
      occurred_at: twoDaysAgo,
      metadata: { hero: true },
    });
    await db.insert(schema.pillarEvents).values({
      vin_id: hero2.id,
      pillar_name: 'service_record',
      pillar_state: 'absent',
      confidence: 0.40,
      evidence_source: 'Dealer management system',
      occurred_at: twoDaysAgo,
      metadata: { hero: true, note: 'Expected service record not found within ±14 day window' },
    });
    console.log('  Inserted pillar events for HERO2 (high P, low C — thin evidence)');
  }

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
