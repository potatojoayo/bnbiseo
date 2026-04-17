ALTER TABLE "cleaning_inspection_asset_reports" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."inspection_status";--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('normal', 'caution', 'defective');--> statement-breakpoint
ALTER TABLE "cleaning_inspection_asset_reports" ALTER COLUMN "status" SET DATA TYPE "public"."inspection_status" USING "status"::"public"."inspection_status";