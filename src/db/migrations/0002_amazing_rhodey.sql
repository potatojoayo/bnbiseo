ALTER TABLE "properties" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "is_active";