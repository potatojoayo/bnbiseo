CREATE TYPE "public"."payment_method" AS ENUM('card', 'bank_transfer');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'cleaning_bank_transfer_requested' BEFORE 'repair_requested';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'cleaning_bank_transfer_confirmed' BEFORE 'repair_requested';--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD COLUMN "payment_method" "payment_method" DEFAULT 'card' NOT NULL;--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD COLUMN "paid_at" timestamp with time zone;