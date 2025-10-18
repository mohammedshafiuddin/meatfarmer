CREATE TABLE "payment_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" varchar(50) NOT NULL,
	"gateway" varchar(50) NOT NULL,
	"orderId" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "token_payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"payment_id" integer NOT NULL,
	"token_id" integer NOT NULL
);
