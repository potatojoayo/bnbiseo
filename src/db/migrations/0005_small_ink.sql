ALTER TYPE "public"."cleaning_status" ADD VALUE 'pending_payment' BEFORE 'pending';--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD COLUMN "order_id" text;--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD COLUMN "payment_key" text;