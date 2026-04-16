CREATE TYPE "public"."property_space_category" AS ENUM('living_room', 'bedroom', 'bathroom');--> statement-breakpoint
CREATE TABLE "property_space_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_space_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"caption" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"category" "property_space_category" NOT NULL,
	"floor" smallint DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"pyeong" smallint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_space_photos" ADD CONSTRAINT "property_space_photos_property_space_id_property_spaces_id_fk" FOREIGN KEY ("property_space_id") REFERENCES "public"."property_spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_spaces" ADD CONSTRAINT "property_spaces_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;