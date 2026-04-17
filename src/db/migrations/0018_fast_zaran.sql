CREATE TYPE "public"."inspection_status" AS ENUM('normal', 'issue', 'broken');--> statement-breakpoint
CREATE TABLE "cleaning_inspection_asset_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"status" "inspection_status",
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaning_inspection_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaning_request_id" uuid NOT NULL,
	"summary_memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cleaning_inspection_asset_reports" ADD CONSTRAINT "cleaning_inspection_asset_reports_report_id_cleaning_inspection_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."cleaning_inspection_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaning_inspection_asset_reports" ADD CONSTRAINT "cleaning_inspection_asset_reports_asset_id_property_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."property_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaning_inspection_reports" ADD CONSTRAINT "cleaning_inspection_reports_cleaning_request_id_cleaning_requests_id_fk" FOREIGN KEY ("cleaning_request_id") REFERENCES "public"."cleaning_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cleaning_inspection_asset_reports_report_asset_idx" ON "cleaning_inspection_asset_reports" USING btree ("report_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cleaning_inspection_reports_cleaning_request_id_idx" ON "cleaning_inspection_reports" USING btree ("cleaning_request_id");