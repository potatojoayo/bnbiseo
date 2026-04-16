ALTER TABLE "properties" ALTER COLUMN "bedrooms" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "bedrooms" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "bathrooms" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "bathrooms" DROP NOT NULL;