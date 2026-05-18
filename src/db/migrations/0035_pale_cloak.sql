CREATE TABLE "property_cleaning_manual_step_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"thumbnail_storage_path" text NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_cleaning_manual_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_cleaning_manual_step_photos" ADD CONSTRAINT "property_cleaning_manual_step_photos_step_id_property_cleaning_manual_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."property_cleaning_manual_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_cleaning_manual_steps" ADD CONSTRAINT "property_cleaning_manual_steps_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "property_cleaning_manual_step_photos_step_idx" ON "property_cleaning_manual_step_photos" USING btree ("step_id","sort_order");--> statement-breakpoint
CREATE INDEX "property_cleaning_manual_steps_property_idx" ON "property_cleaning_manual_steps" USING btree ("property_id","sort_order");