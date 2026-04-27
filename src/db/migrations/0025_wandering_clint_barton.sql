ALTER TYPE "public"."notification_type" ADD VALUE 'repair_requested';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'repair_quoted';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'repair_confirmed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'repair_started';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'repair_completed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'repair_cancelled_by_host';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'repair_cancelled_by_manager';