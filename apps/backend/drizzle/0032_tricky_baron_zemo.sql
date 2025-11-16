CREATE TABLE "mf"."order_cancellations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mf"."order_cancellations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"reason" varchar(500),
	"cancellation_user_notes" text,
	"cancellation_admin_notes" text,
	"cancellation_reviewed" boolean DEFAULT false NOT NULL,
	"refund_amount" numeric(10, 2),
	"refund_status" varchar(50) DEFAULT 'none',
	"razorpay_refund_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"refund_processed_at" timestamp,
	CONSTRAINT "order_cancellations_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "mf"."order_cancellations" ADD CONSTRAINT "order_cancellations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "mf"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."order_cancellations" ADD CONSTRAINT "order_cancellations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mf"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mf"."order_status" DROP COLUMN "is_refund_done";--> statement-breakpoint
ALTER TABLE "mf"."orders" DROP COLUMN "cancellation_reviewed";--> statement-breakpoint
ALTER TABLE "mf"."orders" DROP COLUMN "is_refund_done";