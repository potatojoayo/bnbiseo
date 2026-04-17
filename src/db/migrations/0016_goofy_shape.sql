ALTER TABLE "chat_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "guest_sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "property_photos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "repair_requests" DROP CONSTRAINT "repair_requests_guest_session_id_guest_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "guest_session_id";--> statement-breakpoint
ALTER TABLE "repair_requests" DROP COLUMN "chat_session_id";--> statement-breakpoint
DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE "chat_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "guest_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "property_photos" CASCADE;--> statement-breakpoint
DROP TYPE "public"."chat_role";--> statement-breakpoint
DROP TYPE "public"."chat_session_status";--> statement-breakpoint
DROP TYPE "public"."session_type";
