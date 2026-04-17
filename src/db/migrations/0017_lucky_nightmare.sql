ALTER TABLE "profiles" RENAME COLUMN "avatar_url" TO "avatar_storage_path";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_thumbnail_storage_path" text;