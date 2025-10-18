import { Request, Response } from "express";
import { db } from "../db/db_index.js";
import { specializationsTable } from "../db/schema.js";

/**
 * Get all specializations
 */
export const getAllSpecializations = async (_req: Request, res: Response) => {
    try {

        const specializations = await db.select().from(specializationsTable);
        
        return res.status(200).json(specializations);
    } catch (error) {
        console.error('Error fetching specializations:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
