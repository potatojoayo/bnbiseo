CREATE TYPE "public"."notification_type" AS ENUM('property_submitted', 'property_activated', 'cleaning_requested', 'cleaning_urgent_requested', 'cleaning_assigned', 'cleaning_started', 'cleaning_completed', 'cleaning_cancelled_by_host', 'cleaning_cancelled_by_admin');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"target_path" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"payload" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_profile_created_at_idx" ON "notifications" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_profile_is_read_idx" ON "notifications" USING btree ("profile_id","is_read");