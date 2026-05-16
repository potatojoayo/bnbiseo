CREATE TYPE "public"."cleaning_photo_kind" AS ENUM('before', 'after');--> statement-breakpoint
ALTER TABLE "cleaning_request_photos" ADD COLUMN "property_space_id" uuid;--> statement-breakpoint
ALTER TABLE "cleaning_request_photos" ADD COLUMN "kind" "cleaning_photo_kind" DEFAULT 'after' NOT NULL;--> statement-breakpoint
ALTER TABLE "cleaning_request_photos" ADD CONSTRAINT "cleaning_request_photos_property_space_id_property_spaces_id_fk" FOREIGN KEY ("property_space_id") REFERENCES "public"."property_spaces"("id") ON DELETE set null ON UPDATE no action;