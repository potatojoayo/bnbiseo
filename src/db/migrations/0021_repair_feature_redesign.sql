-- 기존 repair 테이블 데이터는 필요 없으므로 NOT NULL 추가 전에 truncate
TRUNCATE TABLE "repair_requests" CASCADE;--> statement-breakpoint
CREATE TABLE "repair_completion_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"completion_report_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"thumbnail_storage_path" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_completion_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_request_id" uuid NOT NULL,
	"action_notes" text NOT NULL,
	"additional_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_request_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_request_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_request_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_request_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"thumbnail_storage_path" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repair_parts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "repair_photos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "repair_parts" CASCADE;--> statement-breakpoint
DROP TABLE "repair_photos" CASCADE;--> statement-breakpoint
ALTER TABLE "repair_requests" DROP CONSTRAINT "repair_requests_fixture_id_property_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "repair_requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "repair_requests" ALTER COLUMN "status" SET DEFAULT 'submitted'::text;--> statement-breakpoint
DROP TYPE "public"."repair_status";--> statement-breakpoint
CREATE TYPE "public"."repair_status" AS ENUM('submitted', 'quoted', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "repair_requests" ALTER COLUMN "status" SET DEFAULT 'submitted'::"public"."repair_status";--> statement-breakpoint
ALTER TABLE "repair_requests" ALTER COLUMN "status" SET DATA TYPE "public"."repair_status" USING "status"::"public"."repair_status";--> statement-breakpoint
ALTER TABLE "repair_requests" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "host_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "manager_id" uuid;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "preferred_scheduled_date" text NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "preferred_scheduled_time" text NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "scheduled_date" text;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "scheduled_time" text;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "quoted_cost" integer;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "quote_note" text;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "order_id" text;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "payment_key" text;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "quoted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repair_completion_photos" ADD CONSTRAINT "repair_completion_photos_completion_report_id_repair_completion_reports_id_fk" FOREIGN KEY ("completion_report_id") REFERENCES "public"."repair_completion_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_completion_reports" ADD CONSTRAINT "repair_completion_reports_repair_request_id_repair_requests_id_fk" FOREIGN KEY ("repair_request_id") REFERENCES "public"."repair_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_request_assets" ADD CONSTRAINT "repair_request_assets_repair_request_id_repair_requests_id_fk" FOREIGN KEY ("repair_request_id") REFERENCES "public"."repair_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_request_assets" ADD CONSTRAINT "repair_request_assets_asset_id_property_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."property_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_request_photos" ADD CONSTRAINT "repair_request_photos_repair_request_id_repair_requests_id_fk" FOREIGN KEY ("repair_request_id") REFERENCES "public"."repair_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "repair_completion_reports_repair_request_id_idx" ON "repair_completion_reports" USING btree ("repair_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repair_request_assets_request_asset_idx" ON "repair_request_assets" USING btree ("repair_request_id","asset_id");--> statement-breakpoint
ALTER TABLE "repair_requests" ADD CONSTRAINT "repair_requests_host_id_profiles_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD CONSTRAINT "repair_requests_manager_id_managers_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."managers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "fixture_id";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "source";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "ai_diagnosis";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "ai_parts_estimate";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "ai_cost_estimate";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "scheduled_at";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "assigned_to";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "actual_cost";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "completion_notes";--> statement-breakpoint
DROP TYPE "public"."photo_type";--> statement-breakpoint
DROP TYPE "public"."repair_priority";--> statement-breakpoint
DROP TYPE "public"."repair_source";--> statement-breakpoint
DROP TYPE "public"."uploaded_by";