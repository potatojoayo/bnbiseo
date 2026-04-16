CREATE TYPE "public"."property_status" AS ENUM('pending_activation', 'active');--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "status" "property_status" DEFAULT 'pending_activation' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "activated_at" timestamp with time zone;--> statement-breakpoint
UPDATE "properties"
SET
  "status" = 'active',
  "activated_at" = COALESCE("updated_at", "created_at", now());--> statement-breakpoint
