"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHospitalAdminDashboard = exports.getHospitalDoctors = exports.deleteHospital = exports.updateHospital = exports.getHospitalById = exports.getHospitals = exports.createHospital = void 0;
const db_index_1 = require("../db/db_index");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const const_strings_1 = require("../lib/const-strings");
const s3_client_1 = require("../lib/s3-client");
const api_error_1 = require("../lib/api-error");
/**
 * Create a new hospital
 */
const createHospital = async (req, res) => {
    const { name, description, address, adminId } = req.body;
    // Validate required fields
    if (!name || !address) {
        return res.status(400).json({ error: "Name and address are required" });
    }
    // Extract hospitalImages from req.files
    const hospitalImages = req.files?.filter(item => item.fieldname === 'hospitalImages');
    let uploadedImageUrls = [];
    if (hospitalImages && Array.isArray(hospitalImages)) {
        const imageUploadPromises = hospitalImages.map((file, index) => {
            const key = `hospital-images/${Date.now()}-${index}`;
            return (0, s3_client_1.imageUploadS3)(file.buffer, file.mimetype, key);
        });
        uploadedImageUrls = await Promise.all(imageUploadPromises);
    }
    // Use a transaction to ensure both operations succeed or fail together
    return await db_index_1.db.transaction(async (tx) => {
        // Create a new hospital
        const [newHospital] = await tx
            .insert(schema_1.hospitalTable)
            .values({
            name,
            description,
            address,
            hospitalImages: uploadedImageUrls.join(","), // Save URLs as comma-separated string
        })
            .returning();
        // If an admin ID was provided, assign the admin to the hospital
        if (adminId) {
            await tx
                .insert(schema_1.hospitalEmployeesTable)
                .values({
                hospitalId: newHospital.id,
                userId: adminId,
                designation: const_strings_1.DESIGNATIONS.HOSPITAL_ADMIN,
            });
        }
        return res.status(201).json({
            hospital: newHospital,
            message: "Hospital created successfully",
        });
    });
};
exports.createHospital = createHospital;
/**
 * Get all hospitals
 */
const getHospitals = async (req, res) => {
    try {
        const hospitals = await db_index_1.db.query.hospitalTable.findMany();
        return res.status(200).json({
            hospitals,
            count: hospitals.length
        });
    }
    catch (error) {
        console.error("Get hospitals error:", error);
        return res.status(500).json({ error: "Failed to fetch hospitals" });
    }
};
exports.getHospitals = getHospitals;
/**
 * Get a hospital by ID
 */
const getHospitalById = async (req, res) => {
    const { id } = req.params;
    const hospital = await db_index_1.db.query.hospitalTable.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.hospitalTable.id, parseInt(id))
    });
    if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
    }
    // Get doctors working at this hospital
    const hospitalDoctors = await db_index_1.db
        .select({
        userId: schema_1.usersTable.id
    })
        .from(schema_1.hospitalEmployeesTable)
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, schema_1.usersTable.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, parseInt(id)), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.designation, const_strings_1.DESIGNATIONS.DOCTOR)));
    // Get unique specializations from all doctors in this hospital
    let specializations = [];
    if (hospitalDoctors.length > 0) {
        const doctorIds = hospitalDoctors.map(doctor => doctor.userId);
        specializations = await db_index_1.db
            .selectDistinct({
            id: schema_1.specializationsTable.id,
            name: schema_1.specializationsTable.name,
            description: schema_1.specializationsTable.description
        })
            .from(schema_1.doctorSpecializationsTable)
            .innerJoin(schema_1.specializationsTable, (0, drizzle_orm_1.eq)(schema_1.doctorSpecializationsTable.specializationId, schema_1.specializationsTable.id))
            .where((0, drizzle_orm_1.sql) `${schema_1.doctorSpecializationsTable.doctorId} IN (${drizzle_orm_1.sql.join(doctorIds, (0, drizzle_orm_1.sql) `, `)})`);
    }
    // Convert comma-separated image URLs to signed URLs
    let signedImageUrls = [];
    if (hospital.hospitalImages) {
        const imageUrls = hospital.hospitalImages.split(",").map(url => url.trim()).filter(Boolean);
        signedImageUrls = await (0, s3_client_1.generateSignedUrlsFromS3Urls)(imageUrls);
    }
    return res.status(200).json({
        hospital: {
            ...hospital,
            hospitalImages: signedImageUrls,
            specializations
        }
    });
};
exports.getHospitalById = getHospitalById;
;
/**
 * Update a hospital
 */
const updateHospital = async (req, res) => {
    const { id } = req.params;
    const { name, description, address, adminsToAdd, adminsToRemove, doctorsToAdd, doctorsToRemove, imagesToRemove } = req.body;
    if (!name || !address) {
        throw new api_error_1.ApiError("Name and address are required", 400);
    }
    // First, get the existing hospital to access current images
    const existingHospital = await db_index_1.db.query.hospitalTable.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.hospitalTable.id, parseInt(id))
    });
    if (!existingHospital) {
        throw new api_error_1.ApiError("Hospital not found", 404);
    }
    // Extract hospitalImages from req.files and cast to expected type
    const hospitalImages = req.files?.filter(item => item.fieldname === 'hospitalImages');
    let uploadedImageUrls = [];
    if (hospitalImages && Array.isArray(hospitalImages) && hospitalImages.length > 0) {
        const imageUploadPromises = hospitalImages.map((file, index) => {
            const key = `hospital-images/${Date.now()}-${index}`;
            return (0, s3_client_1.imageUploadS3)(file.buffer, file.mimetype, key);
        });
        uploadedImageUrls = await Promise.all(imageUploadPromises);
    }
    // Process existing images: remove those marked for removal, keep the rest, and add new ones
    let updatedImageUrls = [];
    if (existingHospital.hospitalImages) {
        const existingImageUrls = existingHospital.hospitalImages.split(",").map(url => url.trim()).filter(Boolean);
        // If images to remove were provided, filter them out from existing images
        if (imagesToRemove && imagesToRemove.length > 0) {
            try {
                const imagesToRemoveSignedUrls = typeof imagesToRemove === 'string' ? JSON.parse(imagesToRemove) : imagesToRemove;
                const imagesToRemoveArray = imagesToRemoveSignedUrls.map((item) => (0, s3_client_1.getOriginalUrlFromSignedUrl)(item));
                updatedImageUrls = existingImageUrls.filter(url => !imagesToRemoveArray.includes(url));
            }
            catch (error) {
                console.error("Error parsing imagesToRemove:", error);
                updatedImageUrls = existingImageUrls; // Keep all existing images if parsing fails
            }
        }
        else {
            updatedImageUrls = existingImageUrls;
        }
    }
    // Add newly uploaded images to the updated list
    updatedImageUrls = [...updatedImageUrls, ...uploadedImageUrls];
    // Use a transaction to ensure all operations succeed or fail together
    return await db_index_1.db.transaction(async (tx) => {
        const [updatedHospital] = await tx
            .update(schema_1.hospitalTable)
            .set({
            name,
            description,
            address,
            hospitalImages: updatedImageUrls.join(","), // Save URLs as comma-separated string
        })
            .where((0, drizzle_orm_1.eq)(schema_1.hospitalTable.id, parseInt(id)))
            .returning();
        if (!updatedHospital) {
            throw new api_error_1.ApiError("Hospital not found", 404);
        }
        // Process admins to remove if any
        if (adminsToRemove && adminsToRemove.length > 0) {
            for (const adminId of adminsToRemove) {
                await tx
                    .delete(schema_1.hospitalEmployeesTable)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, updatedHospital.id), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, adminId), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.designation, const_strings_1.DESIGNATIONS.HOSPITAL_ADMIN)));
            }
        }
        // Process admins to add if any
        if (adminsToAdd && adminsToAdd.length > 0) {
            for (const adminId of adminsToAdd) {
                // Check if admin is already an employee of this hospital
                const existingAdmin = await tx
                    .select()
                    .from(schema_1.hospitalEmployeesTable)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, updatedHospital.id), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, adminId), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.designation, const_strings_1.DESIGNATIONS.HOSPITAL_ADMIN)))
                    .limit(1);
                // Only add if not already an admin
                if (existingAdmin.length === 0) {
                    await tx
                        .insert(schema_1.hospitalEmployeesTable)
                        .values({
                        hospitalId: updatedHospital.id,
                        userId: adminId,
                        designation: const_strings_1.DESIGNATIONS.HOSPITAL_ADMIN,
                    });
                }
            }
        }
        // Process doctors to remove if any
        if (doctorsToRemove && doctorsToRemove.length > 0) {
            for (const doctorId of doctorsToRemove) {
                await tx
                    .delete(schema_1.hospitalEmployeesTable)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, updatedHospital.id), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, doctorId), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.designation, const_strings_1.DESIGNATIONS.DOCTOR)));
            }
        }
        // Process doctors to add if any
        if (doctorsToAdd && doctorsToAdd.length > 0) {
            for (const doctorId of doctorsToAdd) {
                // Check if doctor is already an employee of this hospital
                const existingDoctor = await tx
                    .select()
                    .from(schema_1.hospitalEmployeesTable)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, updatedHospital.id), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, doctorId), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.designation, const_strings_1.DESIGNATIONS.DOCTOR)))
                    .limit(1);
                // Only add if not already a doctor
                if (existingDoctor.length === 0) {
                    await tx
                        .insert(schema_1.hospitalEmployeesTable)
                        .values({
                        hospitalId: updatedHospital.id,
                        userId: doctorId,
                        designation: const_strings_1.DESIGNATIONS.DOCTOR,
                    });
                }
            }
        }
        return res.status(200).json({
            hospital: updatedHospital,
            message: "Hospital updated successfully",
        });
    });
};
exports.updateHospital = updateHospital;
/**
 * Delete a hospital
 */
const deleteHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const [deletedHospital] = await db_index_1.db
            .delete(schema_1.hospitalTable)
            .where((0, drizzle_orm_1.eq)(schema_1.hospitalTable.id, parseInt(id)))
            .returning();
        if (!deletedHospital) {
            return res.status(404).json({ error: "Hospital not found" });
        }
        return res.status(200).json({
            message: "Hospital deleted successfully"
        });
    }
    catch (error) {
        console.error("Delete hospital error:", error);
        return res.status(500).json({ error: "Failed to delete hospital" });
    }
};
exports.deleteHospital = deleteHospital;
/**
 * Get hospital doctors with their specializations
 */
const getHospitalDoctors = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        // Validate hospital ID
        if (!hospitalId) {
            return res.status(400).json({ error: "Hospital ID is required" });
        }
        // Get doctors working at this hospital
        const hospitalDoctors = await db_index_1.db
            .select({
            id: schema_1.usersTable.id,
            name: schema_1.usersTable.name,
            profilePicUrl: schema_1.usersTable.profilePicUrl,
            qualifications: schema_1.doctorInfoTable.qualifications,
            dailyTokenCount: schema_1.doctorInfoTable.dailyTokenCount,
            consultationFee: schema_1.doctorInfoTable.consultationFee
        })
            .from(schema_1.hospitalEmployeesTable)
            .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, schema_1.usersTable.id))
            .innerJoin(schema_1.doctorInfoTable, (0, drizzle_orm_1.eq)(schema_1.usersTable.id, schema_1.doctorInfoTable.userId))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, parseInt(hospitalId)), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.designation, const_strings_1.DESIGNATIONS.DOCTOR)));
        // Fetch all doctor IDs for efficient querying
        const doctorIds = hospitalDoctors.map((doctor) => doctor.id);
        // Early return if no doctors found
        if (doctorIds.length === 0) {
            return res.status(200).json({
                doctors: []
            });
        }
        // Get specializations for all doctors
        const doctorSpecializations = await db_index_1.db
            .select({
            doctorId: schema_1.doctorSpecializationsTable.doctorId,
            specializationId: schema_1.doctorSpecializationsTable.specializationId,
            name: schema_1.specializationsTable.name,
            description: schema_1.specializationsTable.description
        })
            .from(schema_1.doctorSpecializationsTable)
            .innerJoin(schema_1.specializationsTable, (0, drizzle_orm_1.eq)(schema_1.doctorSpecializationsTable.specializationId, schema_1.specializationsTable.id))
            .where((0, drizzle_orm_1.sql) `${schema_1.doctorSpecializationsTable.doctorId} IN (${drizzle_orm_1.sql.join(doctorIds, (0, drizzle_orm_1.sql) `, `)})`);
        // Group specializations by doctor ID
        const specializationsByDoctor = {};
        doctorSpecializations.forEach(spec => {
            if (!specializationsByDoctor[spec.doctorId]) {
                specializationsByDoctor[spec.doctorId] = [];
            }
            specializationsByDoctor[spec.doctorId].push({
                id: spec.specializationId,
                name: spec.name,
                description: spec.description,
            });
        });
        // Add specializations to each doctor
        const doctorsWithSpecializations = hospitalDoctors.map(doctor => ({
            ...doctor,
            specializations: specializationsByDoctor[doctor.id] || []
        }));
        return res.status(200).json({
            doctors: doctorsWithSpecializations
        });
    }
    catch (error) {
        console.error("Get hospital doctors error:", error);
        return res.status(500).json({ error: "Failed to fetch hospital doctors" });
    }
};
exports.getHospitalDoctors = getHospitalDoctors;
/**
 * Get hospital admin dashboard data
 * Returns hospital details along with doctors information including
 * current consultations status
 */
const getHospitalAdminDashboard = async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        // Validate hospital ID
        if (!hospitalId) {
            return res.status(400).json({ error: "Hospital ID is required" });
        }
        // Get hospital details
        const hospital = await db_index_1.db.query.hospitalTable.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.hospitalTable.id, parseInt(hospitalId))
        });
        if (!hospital) {
            return res.status(404).json({ error: "Hospital not found" });
        }
        // Get doctors working at this hospital
        const hospitalDoctors = await db_index_1.db
            .select({
            id: schema_1.usersTable.id,
            name: schema_1.usersTable.name,
            profilePicUrl: schema_1.usersTable.profilePicUrl,
            qualifications: schema_1.doctorInfoTable.qualifications,
            dailyTokenCount: schema_1.doctorInfoTable.dailyTokenCount,
            consultationFee: schema_1.doctorInfoTable.consultationFee
        })
            .from(schema_1.hospitalEmployeesTable)
            .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, schema_1.usersTable.id))
            .innerJoin(schema_1.doctorInfoTable, (0, drizzle_orm_1.eq)(schema_1.usersTable.id, schema_1.doctorInfoTable.userId))
            .where((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, parseInt(hospitalId)));
        // Get admins working at this hospital
        const hospitalAdmins = await db_index_1.db
            .select({
            id: schema_1.usersTable.id,
            name: schema_1.usersTable.name,
            profilePicUrl: schema_1.usersTable.profilePicUrl
        })
            .from(schema_1.hospitalEmployeesTable)
            .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, schema_1.usersTable.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, parseInt(hospitalId)), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.designation, const_strings_1.DESIGNATIONS.HOSPITAL_ADMIN)));
        // Fetch all doctor IDs for efficient querying
        const doctorIds = hospitalDoctors.map((doctor) => doctor.id);
        // Early return if no doctors found
        if (doctorIds.length === 0) {
            return res.status(200).json({
                hospital,
                doctors: [],
                admins: hospitalAdmins
            });
        }
        // Get today's availability for all doctors
        const doctorAvailabilities = await db_index_1.db
            .select()
            .from(schema_1.doctorAvailabilityTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${schema_1.doctorAvailabilityTable.doctorId} IN (${drizzle_orm_1.sql.join(doctorIds, (0, drizzle_orm_1.sql) `, `)})`, (0, drizzle_orm_1.eq)(schema_1.doctorAvailabilityTable.date, currentDate)));
        // Organize data by doctor
        const doctorsWithDetails = hospitalDoctors.map((doctor) => {
            // Get today's availability for this doctor
            const availability = doctorAvailabilities.find((avail) => avail.doctorId === doctor.id) || {
                totalTokenCount: doctor.dailyTokenCount,
                filledTokenCount: 0,
                consultationsDone: 0,
                isStopped: false
            };
            return {
                id: doctor.id,
                name: doctor.name,
                profilePicUrl: doctor.profilePicUrl,
                qualifications: doctor.qualifications,
                consultationFee: doctor.consultationFee,
                tokensIssuedToday: availability.filledTokenCount,
                totalTokenCount: availability.totalTokenCount,
                consultationsDone: availability.consultationsDone,
                currentConsultationNumber: availability.consultationsDone, // Using consultationsDone as current number
                isAvailable: !availability.isStopped,
                availableTokens: availability.totalTokenCount - availability.filledTokenCount
            };
        });
        return res.status(200).json({
            hospital: {
                id: hospital.id,
                name: hospital.name,
                address: hospital.address,
                description: hospital.description
            },
            doctors: doctorsWithDetails,
            admins: hospitalAdmins,
            currentDate,
            totalDoctors: doctorsWithDetails.length,
            totalAppointmentsToday: doctorsWithDetails.reduce((acc, doc) => acc + doc.tokensIssuedToday, 0),
            totalConsultationsDone: doctorsWithDetails.reduce((acc, doc) => acc + doc.consultationsDone, 0)
        });
    }
    catch (error) {
        console.error("Get hospital admin dashboard error:", error);
        return res.status(500).json({ error: "Failed to fetch hospital admin dashboard data" });
    }
};
exports.getHospitalAdminDashboard = getHospitalAdminDashboard;
/**
 * Upload hospital images to S3 and return their URLs
 */
async function uploadHospitalImages(images) {
    console.log({ images });
    const uploadedImageUrls = [];
    for (const [index, image] of images.entries()) {
        const key = `hospital-images/${Date.now()}-${index}`;
        const imageUrl = await (0, s3_client_1.imageUploadS3)(image.buffer, image.mimeType, key);
        console.log({ imageUrl });
        uploadedImageUrls.push(imageUrl);
    }
    return uploadedImageUrls;
}
