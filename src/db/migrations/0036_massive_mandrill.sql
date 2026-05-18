CREATE TABLE "cleaning_manual_step_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cleaning_request_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cleaning_manual_step_checks" ADD CONSTRAINT "cleaning_manual_step_checks_cleaning_request_id_cleaning_requests_id_fk" FOREIGN KEY ("cleaning_request_id") REFERENCES "public"."cleaning_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaning_manual_step_checks" ADD CONSTRAINT "cleaning_manual_step_checks_step_id_property_cleaning_manual_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."property_cleaning_manual_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cleaning_manual_step_checks_request_step_idx" ON "cleaning_manual_step_checks" USING btree ("cleaning_request_id","step_id");