"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const db_index_1 = require("./db_index");
const schema_1 = require("./schema");
async function seed() {
    console.log("Seeding database...");
    // Seed units
    await db_index_1.db.insert(schema_1.units).values([
        { shortNotation: "Kg", fullName: "Kilogram" },
        { shortNotation: "L", fullName: "Litre" },
        { shortNotation: "Dozen", fullName: "Dozen" },
        { shortNotation: "Unit", fullName: "Unit Piece" },
    ]);
    console.log("Seeding completed.");
}
