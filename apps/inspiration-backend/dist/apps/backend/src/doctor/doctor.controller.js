"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDoctorInning = exports.getDoctorUpcomingLeaves = exports.markDoctorLeave = exports.getDoctorResponders = exports.getUnassignedDoctors = void 0;
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const db_index_js_1 = require("../db/db_index.js");
const schema_js_2 = require("../db/schema.js");
const drizzle_orm_2 = require("drizzle-orm");
const api_error_js_1 = require("../lib/api-error.js");
/**
 * Get doctors who are not associated with any hospital
 */
const getUnassignedDoctors = async (_req, res, next) => {
    try {
        // Get all doctors who are not in the hospital_employees table
        const doctors = await db_index_js_1.db
            .select({
            id: schema_js_2.usersTable.id,
            name: schema_js_2.usersTable.name,
            username: schema_js_2.usersTable.username,
        })
            .from(schema_js_2.usersTable)
            .innerJoin(schema_js_2.doctorInfoTable, (0, drizzle_orm_2.eq)(schema_js_2.doctorInfoTable.userId, schema_js_2.usersTable.id))
            .where(
        // Only select users that don't exist in hospital_employees table
        (0, drizzle_orm_2.sql) `NOT EXISTS (
                    SELECT 1 FROM ${schema_js_2.hospitalEmployeesTable} 
                    WHERE ${schema_js_2.hospitalEmployeesTable.userId} = ${schema_js_2.usersTable.id}
                )`);
        return res.status(200).json(doctors);
    }
    catch (error) {
        next(error);
    }
};
exports.getUnassignedDoctors = getUnassignedDoctors;
/**
 * Get doctor responders for a specific doctor
 * Fetches the secretaries assigned to a particular doctor who can respond on their behalf
 *
 * @param req Request object containing doctorId query parameter
 * @param res Response object
 * @param next Next function
 */
const getDoctorResponders = async (req, res, next) => {
    try {
        // Extract doctorId from query parameters
        const doctorIdParam = req.query.doctorId;
        if (!doctorIdParam) {
            throw new api_error_js_1.ApiError("Missing required parameter: doctorId", 400);
        }
        // Convert doctorId to number
        const doctorId = parseInt(doctorIdParam, 10);
        // Check if doctorId is a valid number
        if (isNaN(doctorId)) {
            throw new api_error_js_1.ApiError("Invalid doctorId: must be a number", 400);
        }
        // Check if the doctor exists
        const doctor = await db_index_js_1.db.query.doctorInfoTable.findFirst({
            where: (0, drizzle_orm_2.eq)(schema_js_2.doctorInfoTable.userId, doctorId),
            with: {
                user: true
            }
        });
        if (!doctor) {
            throw new api_error_js_1.ApiError("Doctor not found", 404);
        }
        // Fetch all secretaries for this doctor
        const secretaries = await db_index_js_1.db
            .select({
            id: schema_js_2.usersTable.id,
            name: schema_js_2.usersTable.name,
            email: schema_js_2.usersTable.email,
            mobile: schema_js_1.mobileNumbersTable.mobile,
            profilePicUrl: schema_js_2.usersTable.profilePicUrl
        })
            .from(schema_js_2.doctorSecretariesTable)
            .innerJoin(schema_js_2.usersTable, (0, drizzle_orm_2.eq)(schema_js_2.doctorSecretariesTable.secretaryId, schema_js_2.usersTable.id))
            .leftJoin(schema_js_2.usersTable, (0, drizzle_orm_2.eq)(schema_js_2.usersTable.mobileId, schema_js_1.mobileNumbersTable.id))
            .where((0, drizzle_orm_2.eq)(schema_js_2.doctorSecretariesTable.doctorId, doctorId));
        return res.status(200).json({
            doctorId: doctorId,
            doctorName: doctor.user.name,
            responders: secretaries,
            count: secretaries.length
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDoctorResponders = getDoctorResponders;
/**
 * Mark doctor's leave for a date range
 * Body: { startDate: string, endDate: string }
 * Path: /doctors/:doctorId/mark-leave
 */
const markDoctorLeave = async (req, res, next) => {
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
        const dates = [];
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
            const existing = await db_index_js_1.db
                .select()
                .from(schema_js_1.doctorAvailabilityTable)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_2.eq)(schema_js_1.doctorAvailabilityTable.doctorId, doctorId), (0, drizzle_orm_2.eq)(schema_js_1.doctorAvailabilityTable.date, rec.date)));
            if (existing.length > 0) {
                await db_index_js_1.db.update(schema_js_1.doctorAvailabilityTable)
                    .set({ isLeave: true })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_2.eq)(schema_js_1.doctorAvailabilityTable.doctorId, doctorId), (0, drizzle_orm_2.eq)(schema_js_1.doctorAvailabilityTable.date, rec.date)));
            }
            else {
                await db_index_js_1.db.insert(schema_js_1.doctorAvailabilityTable).values(rec);
            }
        }
        return res.status(200).json({ success: true, dates });
    }
    catch (error) {
        next(error);
    }
};
exports.markDoctorLeave = markDoctorLeave;
/**
 * Get doctor's leaves for the upcoming month
 * GET /doctors/:doctorId/upcoming-leaves
 */
const getDoctorUpcomingLeaves = async (req, res, next) => {
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
        const leaves = await db_index_js_1.db
            .select()
            .from(schema_js_1.doctorAvailabilityTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_2.eq)(schema_js_1.doctorAvailabilityTable.doctorId, doctorId), (0, drizzle_orm_2.eq)(schema_js_1.doctorAvailabilityTable.isLeave, true), (0, drizzle_orm_2.sql) `${schema_js_1.doctorAvailabilityTable.date} >= ${startDate}`, (0, drizzle_orm_2.sql) `${schema_js_1.doctorAvailabilityTable.date} <= ${endDate}`));
        // Group continuous leave dates into ranges
        const sortedDates = leaves
            .map(l => l.date)
            .sort();
        const ranges = [];
        if (sortedDates.length > 0) {
            let rangeStart = sortedDates[0];
            let prevDate = new Date(sortedDates[0]);
            for (let i = 1; i < sortedDates.length; i++) {
                const currDate = new Date(sortedDates[i]);
                const diff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    // Continue the range
                    prevDate = currDate;
                }
                else {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getDoctorUpcomingLeaves = getDoctorUpcomingLeaves;
/**
 * Update doctor's inning (pause/resume consultations)
 * Expects: doctorId, date, isPaused (boolean), pauseReason (optional if isPaused)
 */
const updateDoctorInning = async (req, res, next) => {
    const { doctorId, date, isPaused, pauseReason } = req.body;
    if (typeof doctorId !== 'number' || !date || typeof isPaused !== 'boolean') {
        throw new api_error_js_1.ApiError('doctorId, date, and isPaused are required', 400);
    }
    // Build update object
    const updateObj = { isPaused };
    if (isPaused) {
        if (!pauseReason) {
            throw new api_error_js_1.ApiError('pauseReason required when pausing', 400);
        }
        updateObj.pauseReason = pauseReason;
    }
    else {
        updateObj.pauseReason = null;
    }
    // Update doctorAvailabilityTable for given doctor and date
    const result = await db_index_js_1.db.update(schema_js_1.doctorAvailabilityTable)
        .set(updateObj)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_2.eq)(schema_js_1.doctorAvailabilityTable.doctorId, doctorId), (0, drizzle_orm_2.eq)(schema_js_1.doctorAvailabilityTable.date, date)));
    return res.status(200).json({ success: true, updated: result });
};
exports.updateDoctorInning = updateDoctorInning;
