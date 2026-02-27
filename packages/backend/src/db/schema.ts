import { pgTable, uuid, text, real, integer, timestamp, jsonb, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';

export const riskBandEnum = pgEnum('risk_band', ['critical', 'high', 'medium', 'low']);
export const subsystemEnum = pgEnum('subsystem', ['propulsion', 'chassis', 'safety']);
export const pillarStateEnum = pgEnum('pillar_state', ['present', 'absent', 'unknown']);
export const bookingStatusEnum = pgEnum('booking_status', ['draft', 'held', 'exported']);

export const vins = pgTable('vins', {
  id: uuid('id').primaryKey().defaultRandom(),
  vin_code: text('vin_code').notNull().unique(),
  year: integer('year').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  trim: text('trim').notNull(),
  subsystem: subsystemEnum('subsystem').notNull(),
  posterior_p: real('posterior_p').notNull().default(0),
  posterior_c: real('posterior_c').notNull().default(0),
  posterior_s: real('posterior_s').notNull().default(0),
  risk_band: riskBandEnum('risk_band').notNull().default('low'),
  home_area: text('home_area'),
  last_event_at: timestamp('last_event_at', { withTimezone: true }).notNull().defaultNow(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pillarEvents = pgTable('pillar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  vin_id: uuid('vin_id').notNull().references(() => vins.id),
  pillar_name: text('pillar_name').notNull(),
  pillar_state: pillarStateEnum('pillar_state').notNull(),
  confidence: real('confidence').notNull().default(0.5),
  evidence_source: text('evidence_source').notNull(),
  occurred_at: timestamp('occurred_at', { withTimezone: true }).notNull(),
  metadata: jsonb('metadata').default({}),
});

export const posteriorSnapshots = pgTable('posterior_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  vin_id: uuid('vin_id').notNull().references(() => vins.id),
  p_score: real('p_score').notNull(),
  c_score: real('c_score').notNull(),
  s_score: real('s_score').notNull(),
  risk_band: riskBandEnum('risk_band').notNull(),
  pillar_vector: jsonb('pillar_vector').default({}),
  frame_index: integer('frame_index').notNull(),
  computed_at: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const governanceActions = pgTable('governance_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  vin_id: uuid('vin_id').notNull().references(() => vins.id),
  action_type: text('action_type').notNull(),
  reason: text('reason').notNull(),
  triggered_by: text('triggered_by').notNull(),
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const memoryRecords = pgTable('memory_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  vin_id: uuid('vin_id').notNull().references(() => vins.id),
  record_type: text('record_type').notNull(),
  content: text('content').notNull(),
  source: text('source').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const dealerDirectory = pgTable('dealer_directory', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  metro_area: text('metro_area').notNull(),
  postal_prefix: text('postal_prefix').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  capabilities: jsonb('capabilities').default([]),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
});

export const vinPreferences = pgTable('vin_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  vin_id: uuid('vin_id').notNull().references(() => vins.id).unique(),
  home_area: text('home_area'),
  preferred_dealer_id: uuid('preferred_dealer_id').references(() => dealerDirectory.id),
  use_preferred_first: integer('use_preferred_first').notNull().default(1),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fsrSlots = pgTable('fsr_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealer_id: uuid('dealer_id').notNull().references(() => dealerDirectory.id),
  date: text('date').notNull(),
  time_block: text('time_block').notNull(),
  capacity: integer('capacity').notNull().default(2),
  booked: integer('booked').notNull().default(0),
});

export const bookingDrafts = pgTable('booking_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  vin_id: uuid('vin_id').notNull().references(() => vins.id),
  dealer_id: uuid('dealer_id').notNull().references(() => dealerDirectory.id),
  slot_id: uuid('slot_id').notNull().references(() => fsrSlots.id),
  status: bookingStatusEnum('status').notNull().default('draft'),
  reason: text('reason').notNull(),
  contact: jsonb('contact').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
