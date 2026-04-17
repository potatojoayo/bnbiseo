CREATE TABLE "cleaning_inspection_asset_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_report_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"thumbnail_storage_path" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cleaning_request_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaning_request_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"thumbnail_storage_path" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cleaning_inspection_asset_photos" ADD CONSTRAINT "cleaning_inspection_asset_photos_asset_report_id_cleaning_inspection_asset_reports_id_fk" FOREIGN KEY ("asset_report_id") REFERENCES "public"."cleaning_inspection_asset_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaning_request_photos" ADD CONSTRAINT "cleaning_request_photos_cleaning_request_id_cleaning_requests_id_fk" FOREIGN KEY ("cleaning_request_id") REFERENCES "public"."cleaning_requests"("id") ON DELETE cascade ON UPDATE no action;