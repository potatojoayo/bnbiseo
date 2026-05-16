CREATE TYPE "public"."cleaning_prep_photo_kind" AS ENUM('cleaning_closet', 'extra_linen', 'trash_disposal', 'linen_wash_external');--> statement-breakpoint
CREATE TABLE "property_cleaning_prep_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"kind" "cleaning_prep_photo_kind" NOT NULL,
	"storage_path" text NOT NULL,
	"thumbnail_storage_path" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "linen_wash_external_address" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "linen_wash_external_address_detail" text;--> statement-breakpoint
ALTER TABLE "property_cleaning_prep_photos" ADD CONSTRAINT "property_cleaning_prep_photos_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;