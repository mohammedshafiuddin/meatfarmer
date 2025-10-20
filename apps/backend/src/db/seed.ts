import { db } from "./db_index";
import { units, productInfo, deliverySlotInfo, productSlots, keyValStore } from "./schema";
import { eq } from "drizzle-orm";

export async function seed() {
  console.log("Seeding database...");

  // Seed units
  await db.insert(units).values([
    { shortNotation: "Kg", fullName: "Kilogram" },
    { shortNotation: "L", fullName: "Litre" },
    { shortNotation: "Dozen", fullName: "Dozen" },
    { shortNotation: "Unit", fullName: "Unit Piece" },
  ]);

  // Seed key-val store
  const existing = await db.query.keyValStore.findFirst({
    where: eq(keyValStore.key, 'readableOrderId'),
  });
  if (!existing) {
    await db.insert(keyValStore).values({
      key: 'readableOrderId',
      value: { value: 0 },
    });
  }

  console.log("Seeding completed.");
}