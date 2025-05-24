DO $$ BEGIN
 CREATE TYPE "data_status" AS ENUM('planned', 'under_construction', 'operational');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "task_status" AS ENUM('queued', 'running', 'success', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"location_id" uuid,
	"status" "data_status",
	"developer" text,
	"sqft" numeric,
	"power_mw" numeric,
	"first_seen" date,
	"last_seen" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_center_id" uuid,
	"source_url" text NOT NULL,
	"doc_type" text,
	"scraped_at" timestamp DEFAULT now() NOT NULL,
	"s3_path" text,
	"text_content" text,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"county" text NOT NULL,
	"state" text NOT NULL,
	"fips" text,
	"geom" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "locations_county_state_unique" UNIQUE("county","state")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scrape_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid,
	"initiated_by" uuid,
	"status" "task_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	"log" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_centers_location" ON "data_centers" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_centers_status" ON "data_centers" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_data_center" ON "documents" ("data_center_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_documents_source_url" ON "documents" ("source_url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_locations_county_state" ON "locations" ("county","state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scrape_tasks_location" ON "scrape_tasks" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scrape_tasks_status" ON "scrape_tasks" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scrape_tasks_created_at" ON "scrape_tasks" ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_centers" ADD CONSTRAINT "data_centers_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_data_center_id_data_centers_id_fk" FOREIGN KEY ("data_center_id") REFERENCES "data_centers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scrape_tasks" ADD CONSTRAINT "scrape_tasks_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
