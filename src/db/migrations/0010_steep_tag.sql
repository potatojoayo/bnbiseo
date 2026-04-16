ALTER TABLE "managers" DROP CONSTRAINT "managers_profile_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "managers" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "managers" ADD CONSTRAINT "managers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "managers_profile_id_idx" ON "managers" USING btree ("profile_id");