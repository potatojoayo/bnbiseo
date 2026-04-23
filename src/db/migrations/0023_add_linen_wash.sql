CREATE TYPE "public"."linen_wash_location" AS ENUM('in_house', 'external');--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD COLUMN "linen_wash" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "linen_wash_location" "linen_wash_location";