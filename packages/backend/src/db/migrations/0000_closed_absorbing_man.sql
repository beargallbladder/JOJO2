DO $$ BEGIN
 CREATE TYPE "public"."booking_status" AS ENUM('draft', 'held', 'exported');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pillar_state" AS ENUM('present', 'absent', 'unknown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."risk_band" AS ENUM('critical', 'high', 'medium', 'low');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subsystem" AS ENUM('propulsion', 'chassis', 'safety');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin_id" uuid NOT NULL,
	"dealer_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'draft' NOT NULL,
	"reason" text NOT NULL,
	"contact" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dealer_directory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"metro_area" text NOT NULL,
	"postal_prefix" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	CONSTRAINT "dealer_directory_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fsr_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"date" text NOT NULL,
	"time_block" text NOT NULL,
	"capacity" integer DEFAULT 2 NOT NULL,
	"booked" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"reason" text NOT NULL,
	"triggered_by" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin_id" uuid NOT NULL,
	"record_type" text NOT NULL,
	"content" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pillar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin_id" uuid NOT NULL,
	"pillar_name" text NOT NULL,
	"pillar_state" "pillar_state" NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"evidence_source" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posterior_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin_id" uuid NOT NULL,
	"p_score" real NOT NULL,
	"c_score" real NOT NULL,
	"s_score" real NOT NULL,
	"risk_band" "risk_band" NOT NULL,
	"pillar_vector" jsonb DEFAULT '{}'::jsonb,
	"frame_index" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vin_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin_id" uuid NOT NULL,
	"home_area" text,
	"preferred_dealer_id" uuid,
	"use_preferred_first" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vin_preferences_vin_id_unique" UNIQUE("vin_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin_code" text NOT NULL,
	"year" integer NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"trim" text NOT NULL,
	"subsystem" "subsystem" NOT NULL,
	"posterior_p" real DEFAULT 0 NOT NULL,
	"posterior_c" real DEFAULT 0 NOT NULL,
	"posterior_s" real DEFAULT 0 NOT NULL,
	"risk_band" "risk_band" DEFAULT 'low' NOT NULL,
	"home_area" text,
	"last_event_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vins_vin_code_unique" UNIQUE("vin_code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_vin_id_vins_id_fk" FOREIGN KEY ("vin_id") REFERENCES "public"."vins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_dealer_id_dealer_directory_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealer_directory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_slot_id_fsr_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."fsr_slots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fsr_slots" ADD CONSTRAINT "fsr_slots_dealer_id_dealer_directory_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealer_directory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "governance_actions" ADD CONSTRAINT "governance_actions_vin_id_vins_id_fk" FOREIGN KEY ("vin_id") REFERENCES "public"."vins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_records" ADD CONSTRAINT "memory_records_vin_id_vins_id_fk" FOREIGN KEY ("vin_id") REFERENCES "public"."vins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pillar_events" ADD CONSTRAINT "pillar_events_vin_id_vins_id_fk" FOREIGN KEY ("vin_id") REFERENCES "public"."vins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posterior_snapshots" ADD CONSTRAINT "posterior_snapshots_vin_id_vins_id_fk" FOREIGN KEY ("vin_id") REFERENCES "public"."vins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vin_preferences" ADD CONSTRAINT "vin_preferences_vin_id_vins_id_fk" FOREIGN KEY ("vin_id") REFERENCES "public"."vins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vin_preferences" ADD CONSTRAINT "vin_preferences_preferred_dealer_id_dealer_directory_id_fk" FOREIGN KEY ("preferred_dealer_id") REFERENCES "public"."dealer_directory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
