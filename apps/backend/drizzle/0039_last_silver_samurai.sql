CREATE TABLE "mf"."refunds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."refunds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"refund_amount" numeric(10, 2),
	"refund_status" varchar(50) DEFAULT 'none',
	"merchant_refund_id" varchar(255),
	"refund_processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mf"."order_status" ADD COLUMN "cancellation_user_notes" text;--> statement-breakpoint
ALTER TABLE "mf"."order_status" ADD COLUMN "cancellation_admin_notes" text;--> statement-breakpoint
ALTER TABLE "mf"."order_status" ADD COLUMN "cancellation_reviewed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mf"."order_status" ADD COLUMN "cancellation_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "mf"."refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "mf"."orders"("id") ON DELETE no action ON UPDATE no action;