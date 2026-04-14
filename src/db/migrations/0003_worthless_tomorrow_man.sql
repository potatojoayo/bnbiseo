ALTER TABLE "properties" ADD COLUMN "pyeong" smallint;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "bedrooms" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "bathrooms" smallint DEFAULT 1 NOT NULL;