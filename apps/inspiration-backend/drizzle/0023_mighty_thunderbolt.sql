CREATE TABLE "mobile_numbers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mobile_numbers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"mobile" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_mobile_unique";