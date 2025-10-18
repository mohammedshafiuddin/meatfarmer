"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppointmentsScreenData = exports.getFeaturedHospitals = exports.getFeaturedDoctors = void 0;
const db_index_1 = require("../db/db_index");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const api_error_1 = require("../lib/api-error");
/**
 * Get featured doctors with their associated hospitals and specializations
 *
 * This is a placeholder implementation that returns doctors with highest consultation fees
 * Later we can replace this with a more sophisticated recommendation algorithm
 */
const getFeaturedDoctors = async (req, res, next) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    if (isNaN(limit) || limit < 1) {
        throw new api_error_1.ApiError("Invalid limit parameter", 400);
    }
    // Query doctors sorted by consultation fee (placeholder for recommendation algorithm)
    const featuredDoctors = await db_index_1.db
        .select({
        id: schema_1.usersTable.id,
        doctorId: schema_1.doctorInfoTable.id,
        name: schema_1.usersTable.name,
        profilePicUrl: schema_1.usersTable.profilePicUrl,
        qualifications: schema_1.doctorInfoTable.qualifications,
        consultationFee: schema_1.doctorInfoTable.consultationFee,
        dailyTokenCount: schema_1.doctorInfoTable.dailyTokenCount,
    })
        .from(schema_1.doctorInfoTable)
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.doctorInfoTable.userId, schema_1.usersTable.id))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.doctorInfoTable.consultationFee))
        .limit(limit);
    // For each doctor, fetch their specializations and hospital
    const doctorsWithDetails = await Promise.all(featuredDoctors.map(async (doctor) => {
        // Get specializations
        const specializations = await db_index_1.db
            .select({
            id: schema_1.specializationsTable.id,
            name: schema_1.specializationsTable.name,
            description: schema_1.specializationsTable.description,
        })
            .from(schema_1.doctorSpecializationsTable)
            .innerJoin(schema_1.specializationsTable, (0, drizzle_orm_1.eq)(schema_1.doctorSpecializationsTable.specializationId, schema_1.specializationsTable.id))
            .where((0, drizzle_orm_1.eq)(schema_1.doctorSpecializationsTable.doctorId, doctor.id));
        // Get hospital (if any)
        const hospitalEmployment = await db_index_1.db
            .select({
            hospitalId: schema_1.hospitalTable.id,
            hospitalName: schema_1.hospitalTable.name,
            hospitalAddress: schema_1.hospitalTable.address,
            designation: schema_1.hospitalEmployeesTable.designation,
        })
            .from(schema_1.hospitalEmployeesTable)
            .innerJoin(schema_1.hospitalTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, schema_1.hospitalTable.id))
            .where((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, doctor.id))
            .limit(1);
        // Return the doctor with their specializations and hospital info
        return {
            ...doctor,
            specializations,
            hospital: hospitalEmployment.length > 0 ? {
                id: hospitalEmployment[0].hospitalId,
                name: hospitalEmployment[0].hospitalName,
                address: hospitalEmployment[0].hospitalAddress,
                designation: hospitalEmployment[0].designation,
            } : null
        };
    }));
    return res.status(200).json(doctorsWithDetails);
};
exports.getFeaturedDoctors = getFeaturedDoctors;
/**
 * Get featured hospitals
 *
 * This is a placeholder implementation that returns hospitals with most employees
 * Later we can replace this with a more sophisticated recommendation algorithm
 */
const getFeaturedHospitals = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 5;
        if (isNaN(limit) || limit < 1) {
            throw new api_error_1.ApiError("Invalid limit parameter", 400);
        }
        // Subquery to count employees per hospital
        const hospitalCounts = db_index_1.db
            .select({
            hospitalId: schema_1.hospitalEmployeesTable.hospitalId,
            count: (0, drizzle_orm_1.sql) `count(${schema_1.hospitalEmployeesTable.userId})`.as('employeeCount'),
        })
            .from(schema_1.hospitalEmployeesTable)
            .groupBy(schema_1.hospitalEmployeesTable.hospitalId)
            .as("hospital_counts");
        // Query hospitals with employee counts
        const featuredHospitals = await db_index_1.db
            .select({
            id: schema_1.hospitalTable.id,
            name: schema_1.hospitalTable.name,
            address: schema_1.hospitalTable.address,
            description: schema_1.hospitalTable.description,
            employeeCount: hospitalCounts.count,
        })
            .from(schema_1.hospitalTable)
            .leftJoin(hospitalCounts, (0, drizzle_orm_1.eq)(schema_1.hospitalTable.id, hospitalCounts.hospitalId))
            .orderBy((0, drizzle_orm_1.desc)(hospitalCounts.count))
            .limit(limit);
        return res.status(200).json(featuredHospitals);
    }
    catch (error) {
        next(error);
    }
};
exports.getFeaturedHospitals = getFeaturedHospitals;
/**
 * Get appointments screen data with search functionality
 *
 * This endpoint returns a list of doctors with their associated hospitals and specializations.
 * It supports searching by doctor name, hospital name, or specialization.
 */
const getAppointmentsScreenData = async (req, res, next) => {
    try {
        const searchQuery = req.query.search ? req.query.search.trim() : '';
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        if (isNaN(limit) || limit < 1) {
            throw new api_error_1.ApiError("Invalid limit parameter", 400);
        }
        if (isNaN(offset) || offset < 0) {
            throw new api_error_1.ApiError("Invalid offset parameter", 400);
        }
        // Build the complete query based on whether we have a search query or not
        let doctors;
        if (searchQuery) {
            // Subquery to find doctors by specialization
            const doctorsBySpecialization = db_index_1.db
                .selectDistinct({
                doctorId: schema_1.doctorSpecializationsTable.doctorId,
            })
                .from(schema_1.doctorSpecializationsTable)
                .innerJoin(schema_1.specializationsTable, (0, drizzle_orm_1.eq)(schema_1.doctorSpecializationsTable.specializationId, schema_1.specializationsTable.id))
                .where((0, drizzle_orm_1.ilike)(schema_1.specializationsTable.name, `%${searchQuery}%`));
            // Subquery to find hospitals by name
            const hospitalsByName = db_index_1.db
                .selectDistinct({
                hospitalId: schema_1.hospitalTable.id,
            })
                .from(schema_1.hospitalTable)
                .where((0, drizzle_orm_1.ilike)(schema_1.hospitalTable.name, `%${searchQuery}%`));
            // Subquery to find doctors associated with hospitals found by name
            const doctorsByHospital = db_index_1.db
                .selectDistinct({
                doctorId: schema_1.hospitalEmployeesTable.userId,
            })
                .from(schema_1.hospitalEmployeesTable)
                .innerJoin(hospitalsByName.as('matching_hospitals'), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, (0, drizzle_orm_1.sql) `matching_hospitals.hospitalId`));
            // Execute the query with search conditions
            doctors = await db_index_1.db
                .selectDistinct({
                id: schema_1.usersTable.id,
                doctorId: schema_1.doctorInfoTable.id,
                name: schema_1.usersTable.name,
                profilePicUrl: schema_1.usersTable.profilePicUrl,
                qualifications: schema_1.doctorInfoTable.qualifications,
                consultationFee: schema_1.doctorInfoTable.consultationFee,
                dailyTokenCount: schema_1.doctorInfoTable.dailyTokenCount,
            })
                .from(schema_1.doctorInfoTable)
                .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.doctorInfoTable.userId, schema_1.usersTable.id))
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.usersTable.name, `%${searchQuery}%`), // Doctor name match
            (0, drizzle_orm_1.sql) `exists (select 1 from ${doctorsBySpecialization.as('spec_docs')} where spec_docs.doctorId = ${schema_1.usersTable.id})`, // Specialization match
            (0, drizzle_orm_1.sql) `exists (select 1 from ${doctorsByHospital.as('hospital_docs')} where hospital_docs.doctorId = ${schema_1.usersTable.id})` // Hospital match
            ))
                .limit(limit)
                .offset(offset);
        }
        else {
            // Execute the query without search conditions
            doctors = await db_index_1.db
                .selectDistinct({
                id: schema_1.usersTable.id,
                doctorId: schema_1.doctorInfoTable.id,
                name: schema_1.usersTable.name,
                profilePicUrl: schema_1.usersTable.profilePicUrl,
                qualifications: schema_1.doctorInfoTable.qualifications,
                consultationFee: schema_1.doctorInfoTable.consultationFee,
                dailyTokenCount: schema_1.doctorInfoTable.dailyTokenCount,
            })
                .from(schema_1.doctorInfoTable)
                .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.doctorInfoTable.userId, schema_1.usersTable.id))
                .limit(limit)
                .offset(offset);
        }
        // For each doctor, fetch their specializations and hospital
        const doctorsWithDetails = await Promise.all(doctors.map(async (doctor) => {
            // Get specializations
            const specializations = await db_index_1.db
                .select({
                id: schema_1.specializationsTable.id,
                name: schema_1.specializationsTable.name,
                description: schema_1.specializationsTable.description,
            })
                .from(schema_1.doctorSpecializationsTable)
                .innerJoin(schema_1.specializationsTable, (0, drizzle_orm_1.eq)(schema_1.doctorSpecializationsTable.specializationId, schema_1.specializationsTable.id))
                .where((0, drizzle_orm_1.eq)(schema_1.doctorSpecializationsTable.doctorId, doctor.id));
            // Get hospital (if any)
            const hospitalEmployment = await db_index_1.db
                .select({
                hospitalId: schema_1.hospitalTable.id,
                hospitalName: schema_1.hospitalTable.name,
                hospitalAddress: schema_1.hospitalTable.address,
                designation: schema_1.hospitalEmployeesTable.designation,
            })
                .from(schema_1.hospitalEmployeesTable)
                .innerJoin(schema_1.hospitalTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, schema_1.hospitalTable.id))
                .where((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, doctor.id))
                .limit(1);
            // Return the doctor with their specializations and hospital info
            return {
                ...doctor,
                specializations,
                hospital: hospitalEmployment.length > 0 ? {
                    id: hospitalEmployment[0].hospitalId,
                    name: hospitalEmployment[0].hospitalName,
                    address: hospitalEmployment[0].hospitalAddress,
                    designation: hospitalEmployment[0].designation,
                } : null
            };
        }));
        return res.status(200).json(doctorsWithDetails);
    }
    catch (error) {
        next(error);
    }
};
exports.getAppointmentsScreenData = getAppointmentsScreenData;
