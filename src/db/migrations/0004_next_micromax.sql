CREATE TYPE "public"."cleaning_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."cleaning_type" AS ENUM('standard', 'urgent');--> statement-breakpoint
CREATE TABLE "cleaning_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"cleaning_type" "cleaning_type" DEFAULT 'standard' NOT NULL,
	"status" "cleaning_status" DEFAULT 'pending' NOT NULL,
	"scheduled_date" text NOT NULL,
	"scheduled_time" text NOT NULL,
	"memo" text,
	"price" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"final_price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD CONSTRAINT "cleaning_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaning_requests" ADD CONSTRAINT "cleaning_requests_host_id_profiles_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;