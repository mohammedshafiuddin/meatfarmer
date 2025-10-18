"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyDoctors = void 0;
const db_index_js_1 = require("../db/db_index.js");
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const api_error_js_1 = require("../lib/api-error.js");
const const_strings_js_1 = require("../lib/const-strings.js");
/**
 * Get doctors based on user's responsibilities:
 * - If the user is a hospital admin, returns all doctors in that hospital
 * - If the user is a secretary, returns all doctors they are secretary for
 * - Otherwise returns an empty list
 */
const getMyDoctors = async (req, res, next) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new api_error_js_1.ApiError("User not authenticated", 401);
    }
    // First check if the user is a hospital admin
    const hospitalAdmin = await db_index_js_1.db.query.hospitalEmployeesTable.findFirst({
        where: (he) => (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(he.userId, userId), (0, drizzle_orm_1.eq)(he.designation, const_strings_js_1.DESIGNATIONS.HOSPITAL_ADMIN)),
    });
    let doctors = [];
    if (hospitalAdmin) {
        // User is a hospital admin, get all doctors in their hospital
        doctors = await db_index_js_1.db
            .select({
            id: schema_js_1.usersTable.id,
            name: schema_js_1.usersTable.name,
            username: schema_js_1.usersTable.username,
            email: schema_js_1.usersTable.email,
            // mobile: mobileNumbersTable.mobile,
            doctorInfo: {
                id: schema_js_1.doctorInfoTable.id,
                qualifications: schema_js_1.doctorInfoTable.qualifications,
                dailyTokenCount: schema_js_1.doctorInfoTable.dailyTokenCount,
                consultationFee: schema_js_1.doctorInfoTable.consultationFee,
            },
            qualifications: schema_js_1.doctorInfoTable.qualifications,
            specializations: (0, drizzle_orm_1.sql) `
                        (SELECT json_agg(json_build_object(
                            'id', ${schema_js_1.specializationsTable.id},
                            'name', ${schema_js_1.specializationsTable.name},
                            'description', ${schema_js_1.specializationsTable.description}
                        ))
                        FROM ${schema_js_1.doctorSpecializationsTable}
                        JOIN ${schema_js_1.specializationsTable} ON ${schema_js_1.doctorSpecializationsTable.specializationId} = ${schema_js_1.specializationsTable.id}
                        WHERE ${schema_js_1.doctorSpecializationsTable.doctorId} = ${schema_js_1.usersTable.id}
                        GROUP BY ${schema_js_1.doctorSpecializationsTable.doctorId})`,
        })
            .from(schema_js_1.usersTable)
            .innerJoin(schema_js_1.doctorInfoTable, (0, drizzle_orm_1.eq)(schema_js_1.doctorInfoTable.userId, schema_js_1.usersTable.id))
            .leftJoin(schema_js_1.mobileNumbersTable, (0, drizzle_orm_1.eq)(schema_js_1.mobileNumbersTable.id, schema_js_1.usersTable.mobileId))
            .innerJoin(schema_js_1.hospitalEmployeesTable, (0, drizzle_orm_1.eq)(schema_js_1.hospitalEmployeesTable.userId, schema_js_1.usersTable.id))
            .where((0, drizzle_orm_1.eq)(schema_js_1.hospitalEmployeesTable.hospitalId, hospitalAdmin.hospitalId));
    }
    else {
        // Check if the user is a secretary for any doctors
        const secretaryFor = await db_index_js_1.db
            .select({ doctorId: schema_js_1.doctorSecretariesTable.doctorId })
            .from(schema_js_1.doctorSecretariesTable)
            .where((0, drizzle_orm_1.eq)(schema_js_1.doctorSecretariesTable.secretaryId, userId));
        if (secretaryFor.length > 0) {
            const doctorIds = secretaryFor.map((item) => item.doctorId);
            // User is a secretary, get all doctors they are secretary for
            doctors = await db_index_js_1.db
                .select({
                id: schema_js_1.usersTable.id,
                name: schema_js_1.usersTable.name,
                username: schema_js_1.usersTable.username,
                email: schema_js_1.usersTable.email,
                mobile: schema_js_1.mobileNumbersTable.mobile,
                qualifications: schema_js_1.doctorInfoTable.qualifications,
                doctorInfo: {
                    id: schema_js_1.doctorInfoTable.id,
                    qualifications: schema_js_1.doctorInfoTable.qualifications,
                    dailyTokenCount: schema_js_1.doctorInfoTable.dailyTokenCount,
                    consultationFee: schema_js_1.doctorInfoTable.consultationFee,
                },
                specializations: (0, drizzle_orm_1.sql) `
                            (SELECT json_agg(json_build_object(
                                'id', ${schema_js_1.specializationsTable.id},
                                'name', ${schema_js_1.specializationsTable.name},
                                'description', ${schema_js_1.specializationsTable.description}
                            ))
                            FROM ${schema_js_1.doctorSpecializationsTable}
                            JOIN ${schema_js_1.specializationsTable} ON ${schema_js_1.doctorSpecializationsTable.specializationId} = ${schema_js_1.specializationsTable.id}
                            WHERE ${schema_js_1.doctorSpecializationsTable.doctorId} = ${schema_js_1.usersTable.id}
                            GROUP BY ${schema_js_1.doctorSpecializationsTable.doctorId})`,
            })
                .from(schema_js_1.usersTable)
                .innerJoin(schema_js_1.doctorInfoTable, (0, drizzle_orm_1.eq)(schema_js_1.doctorInfoTable.userId, schema_js_1.usersTable.id))
                .innerJoin(schema_js_1.mobileNumbersTable, (0, drizzle_orm_1.eq)(schema_js_1.mobileNumbersTable.id, schema_js_1.usersTable.mobileId))
                .where((0, drizzle_orm_1.inArray)(schema_js_1.usersTable.id, doctorIds));
        }
    }
    return res.status(200).json(doctors);
};
exports.getMyDoctors = getMyDoctors;
