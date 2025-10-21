"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const db_index_1 = require("./db_index");
const schema_1 = require("./schema");
const drizzle_orm_1 = require("drizzle-orm");
async function seed() {
    console.log("Seeding database...");
    // Seed units
    await db_index_1.db.insert(schema_1.units).values([
        { shortNotation: "Kg", fullName: "Kilogram" },
        { shortNotation: "L", fullName: "Litre" },
        { shortNotation: "Dozen", fullName: "Dozen" },
        { shortNotation: "Unit", fullName: "Unit Piece" },
    ]);
    // Seed key-val store
    const existing = await db_index_1.db.query.keyValStore.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.keyValStore.key, 'readableOrderId'),
    });
    if (!existing) {
        await db_index_1.db.insert(schema_1.keyValStore).values({
            key: 'readableOrderId',
            value: { value: 0 },
        });
    }
    console.log("Seeding completed.");
}
