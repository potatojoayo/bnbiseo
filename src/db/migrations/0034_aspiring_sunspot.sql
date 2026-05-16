CREATE TYPE "public"."cleaning_service_type" AS ENUM('general', 'ac');--> statement-breakpoint
CREATE TABLE "cleaning_request_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaning_request_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cleaning_request_photos" ADD COLUMN "property_asset_id" uuid;--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD COLUMN "service_type" "cleaning_service_type" DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "cleaning_request_assets" ADD CONSTRAINT "cleaning_request_assets_cleaning_request_id_cleaning_requests_id_fk" FOREIGN KEY ("cleaning_request_id") REFERENCES "public"."cleaning_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaning_request_assets" ADD CONSTRAINT "cleaning_request_assets_asset_id_property_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."property_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cleaning_request_assets_request_asset_idx" ON "cleaning_request_assets" USING btree ("cleaning_request_id","asset_id");--> statement-breakpoint
ALTER TABLE "cleaning_request_photos" ADD CONSTRAINT "cleaning_request_photos_property_asset_id_property_assets_id_fk" FOREIGN KEY ("property_asset_id") REFERENCES "public"."property_assets"("id") ON DELETE set null ON UPDATE no action;