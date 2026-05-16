CREATE TYPE "public"."cleaning_plan" AS ENUM('one_time', 'regular');--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD COLUMN "cleaning_plan" "cleaning_plan" DEFAULT 'one_time' NOT NULL;