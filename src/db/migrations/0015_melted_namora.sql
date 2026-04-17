ALTER TABLE "fixture_photos" RENAME TO "property_asset_photos";--> statement-breakpoint
ALTER TABLE "fixtures" RENAME TO "property_assets";--> statement-breakpoint
ALTER TABLE "property_asset_photos" RENAME COLUMN "fixture_id" TO "property_asset_id";--> statement-breakpoint
ALTER TABLE "property_asset_photos" DROP CONSTRAINT "fixture_photos_fixture_id_fixtures_id_fk";
--> statement-breakpoint
ALTER TABLE "property_assets" DROP CONSTRAINT "fixtures_property_id_properties_id_fk";
--> statement-breakpoint
ALTER TABLE "repair_requests" DROP CONSTRAINT "repair_requests_fixture_id_fixtures_id_fk";
--> statement-breakpoint
ALTER TABLE "property_asset_photos" ADD COLUMN "thumbnail_storage_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "property_space_photos" ADD COLUMN "thumbnail_storage_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "property_asset_photos" ADD CONSTRAINT "property_asset_photos_property_asset_id_property_assets_id_fk" FOREIGN KEY ("property_asset_id") REFERENCES "public"."property_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_assets" ADD CONSTRAINT "property_assets_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_requests" ADD CONSTRAINT "repair_requests_fixture_id_property_assets_id_fk" FOREIGN KEY ("fixture_id") REFERENCES "public"."property_assets"("id") ON DELETE set null ON UPDATE no action;