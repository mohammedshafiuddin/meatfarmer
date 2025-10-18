import { doctorAvailabilityTable, mobileNumbersTable } from "../db/schema.js";
import { and } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { db } from "../db/db_index.js";
import { usersTable, doctorInfoTable, doctorSpecializationsTable, hospitalEmployeesTable, doctorSecretariesTable } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { ApiError } from "../lib/api-error.js";

/**
 * Get doctors who are not associated with any hospital
 */
export const getUnassignedDoctors = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        // Get all doctors who are not in the hospital_employees table
        const doctors = await db
            .select({
                id: usersTable.id,
                name: usersTable.name,
                username: usersTable.username,
            })
            .from(usersTable)
            .innerJoin(doctorInfoTable, eq(doctorInfoTable.userId, usersTable.id))
            .where(
                // Only select users that don't exist in hospital_employees table
                sql`NOT EXISTS (
                    SELECT 1 FROM ${hospitalEmployeesTable} 
                    WHERE ${hospitalEmployeesTable.userId} = ${usersTable.id}
                )`
            );
            
        
        return res.status(200).json(doctors);
    } catch (error) {
        next(error);
    }
};

/**
 * Get doctor responders for a specific doctor
 * Fetches the secretaries assigned to a particular doctor who can respond on their behalf
 * 
 * @param req Request object containing doctorId query parameter
 * @param res Response object
 * @param next Next function
 */
export const getDoctorResponders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract doctorId from query parameters
        const doctorIdParam = req.query.doctorId;
        
        if (!doctorIdParam) {
            throw new ApiError("Missing required parameter: doctorId", 400);
        }
        
        // Convert doctorId to number
        const doctorId = parseInt(doctorIdParam as string, 10);
        
        // Check if doctorId is a valid number
        if (isNaN(doctorId)) {
            throw new ApiError("Invalid doctorId: must be a number", 400);
        }
        
        // Check if the doctor exists
        const doctor = await db.query.doctorInfoTable.findFirst({
            where: eq(doctorInfoTable.userId, doctorId),
            with: {
                user: true
            }
        });
        
        if (!doctor) {
            throw new ApiError("Doctor not found", 404);
        }
        
        // Fetch all secretaries for this doctor
        const secretaries = await db
            .select({
                id: usersTable.id,
                name: usersTable.name,
                email: usersTable.email,
                mobile: mobileNumbersTable.mobile,
                profilePicUrl: usersTable.profilePicUrl
            })
            .from(doctorSecretariesTable)
            .innerJoin(usersTable, eq(doctorSecretariesTable.secretaryId, usersTable.id))
            .leftJoin(usersTable, eq(usersTable.mobileId, mobileNumbersTable.id))
            .where(eq(doctorSecretariesTable.doctorId, doctorId));
        
        return res.status(200).json({
            doctorId: doctorId,
            doctorName: doctor.user.name,
            responders: secretaries,
            count: secretaries.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark doctor's leave for a date range
 * Body: { startDate: string, endDate: string }
 * Path: /doctors/:doctorId/mark-leave
 */
export const markDoctorLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = parseInt(req.params.doctorId, 10);
        const { startDate, endDate } = req.body;
        if (!doctorId || !startDate || !endDate) {
            return res.status(400).json({ error: "doctorId, startDate, and endDate are required" });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
            return res.status(400).json({ error: "Invalid date range" });
        }

        // Generate all dates in the range
        const dates: string[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d).toISOString().slice(0, 10));
        }

        // Insert leave records for each date
        const records = dates.map(date => ({
            doctorId,
            date,
            isLeave: true,
            isPaused: false,
            pauseReason: null,
            totalTokenCount: 0,
            filledTokenCount: 0,
            consultationsDone: 0,
            isStopped: false,
        }));

        // Upsert: If record exists for doctor/date, update isLeave, else insert
        for (const rec of records) {
            const existing = await db
                .select()
                .from(doctorAvailabilityTable)
                .where(and(
                    eq(doctorAvailabilityTable.doctorId, doctorId),
                    eq(doctorAvailabilityTable.date, rec.date)
                ));
            if (existing.length > 0) {
                await db.update(doctorAvailabilityTable)
                    .set({ isLeave: true })
                    .where(and(
                        eq(doctorAvailabilityTable.doctorId, doctorId),
                        eq(doctorAvailabilityTable.date, rec.date)
                    ));
            } else {
                await db.insert(doctorAvailabilityTable).values(rec);
            }
        }

        return res.status(200).json({ success: true, dates });
    } catch (error) {
        next(error);
    }
};


/**
 * Get doctor's leaves for the upcoming month
 * GET /doctors/:doctorId/upcoming-leaves
 */
export const getDoctorUpcomingLeaves = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doctorId = parseInt(req.params.doctorId, 10);
        if (!doctorId) {
            return res.status(400).json({ error: "doctorId is required" });
        }
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        const startDate = today.toISOString().slice(0, 10);
        const endDate = nextMonth.toISOString().slice(0, 10);

        const leaves = await db
            .select()
            .from(doctorAvailabilityTable)
            .where(and(
                eq(doctorAvailabilityTable.doctorId, doctorId),
                eq(doctorAvailabilityTable.isLeave, true),
                sql`${doctorAvailabilityTable.date} >= ${startDate}`,
                sql`${doctorAvailabilityTable.date} <= ${endDate}`
            ));

        // Group continuous leave dates into ranges
        const sortedDates = leaves
            .map(l => l.date)
            .sort();

        const ranges: { startDate: string, endDate: string }[] = [];
        if (sortedDates.length > 0) {
            let rangeStart = sortedDates[0];
            let prevDate = new Date(sortedDates[0]);
            for (let i = 1; i < sortedDates.length; i++) {
                const currDate = new Date(sortedDates[i]);
                const diff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    // Continue the range
                    prevDate = currDate;
                } else {
                    // End current range and start new
                    ranges.push({ startDate: rangeStart, endDate: prevDate.toISOString().slice(0, 10) });
                    rangeStart = sortedDates[i];
                    prevDate = currDate;
                }
            }
            // Push the last range
            ranges.push({ startDate: rangeStart, endDate: prevDate.toISOString().slice(0, 10) });
        }

        return res.status(200).json({ doctorId, leaveRanges: ranges, leaves });
    } catch (error) {
        next(error);
    }
};


/**
 * Update doctor's inning (pause/resume consultations)
 * Expects: doctorId, date, isPaused (boolean), pauseReason (optional if isPaused)
 */
export const updateDoctorInning = async (req: Request, res: Response, next: NextFunction) => {
        const { doctorId, date, isPaused, pauseReason } = req.body;
        if (typeof doctorId !== 'number' || !date || typeof isPaused !== 'boolean') {
            throw new ApiError('doctorId, date, and isPaused are required', 400);
        }
        // Build update object
        const updateObj: any = { isPaused };
        if (isPaused) {
            if (!pauseReason) {
                throw new ApiError('pauseReason required when pausing', 400);
            }
            updateObj.pauseReason = pauseReason;
        } else {
            updateObj.pauseReason = null;
        }
        // Update doctorAvailabilityTable for given doctor and date
        const result = await db.update(doctorAvailabilityTable)
            .set(updateObj)
            .where(and(
                eq(doctorAvailabilityTable.doctorId, doctorId),
                eq(doctorAvailabilityTable.date, date)
            ));
        return res.status(200).json({ success: true, updated: result });
};
