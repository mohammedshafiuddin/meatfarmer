CREATE TYPE "public"."gender" AS ENUM('Male', 'Female', 'Other');--> statement-breakpoint
ALTER TABLE "user_info" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "user_info" ADD COLUMN "gender" "gender";