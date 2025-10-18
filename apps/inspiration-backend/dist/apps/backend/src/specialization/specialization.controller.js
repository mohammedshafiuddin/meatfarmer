"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSpecializations = void 0;
const db_index_js_1 = require("../db/db_index.js");
const schema_js_1 = require("../db/schema.js");
/**
 * Get all specializations
 */
const getAllSpecializations = async (_req, res) => {
    try {
        const specializations = await db_index_js_1.db.select().from(schema_js_1.specializationsTable);
        return res.status(200).json(specializations);
    }
    catch (error) {
        console.error('Error fetching specializations:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllSpecializations = getAllSpecializations;
