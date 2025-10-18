"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientDetails = exports.searchUsersByMobile = exports.addPushToken = exports.hasPushToken = exports.getUpcomingTokens = exports.getUserResponsibilities = exports.updateUser = exports.getDoctorById = exports.getUserById = exports.getPotentialDoctorEmployees = exports.getPotentialHospitalAdmins = exports.getBusinessUsers = exports.addBusinessUser = exports.login = exports.signup = void 0;
const db_index_1 = require("../db/db_index");
const schema_1 = require("../db/schema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const drizzle_orm_1 = require("drizzle-orm");
const api_error_1 = require("../lib/api-error");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const roles_manager_1 = __importStar(require("../lib/roles-manager"));
const const_strings_1 = require("../lib/const-strings");
const s3_client_1 = require("../lib/s3-client");
/**
 * Register a new user
 */
const signup = async (req, res, next) => {
    try {
        const { name, email, mobile, address, password, role, username } = req.body;
        // Parse and log profilePic
        let profilePicUrl = null;
        if (req.file) {
            // Upload to S3 using buffer
            const key = `profile-pics/${Date.now()}_${req.file.originalname}`;
            profilePicUrl = await (0, s3_client_1.imageUploadS3)(req.file.buffer, req.file.mimetype, key);
        }
        // Validate required fields
        if (!name || !email || !mobile || !password) {
            throw new api_error_1.ApiError("Missing required fields", 400);
        }
        // Check if user with the same email, mobile, or username already exists
        // const existingUser = await db.query.usersTable.findFirst({
        //   where: (users) => {
        //     return or(
        //       eq(users.email, email),
        //       eq(users.mobile, mobile),
        //       username ? eq(users.username, username) : undefined
        //     );
        //   },
        // });
        const existingUser = await db_index_1.db
            .select()
            .from(schema_1.usersTable)
            .leftJoin(schema_1.mobileNumbersTable, (0, drizzle_orm_1.eq)(schema_1.mobileNumbersTable.id, schema_1.usersTable.mobileId))
            .where((0, drizzle_orm_1.eq)(schema_1.mobileNumbersTable.mobile, mobile));
        if (existingUser) {
            throw new api_error_1.ApiError("User with this email, mobile, or username already exists", 409);
        }
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Start a transaction
        return await db_index_1.db.transaction(async (tx) => {
            // Create a new user
            const mobileRecord = await tx
                .insert(schema_1.mobileNumbersTable)
                .values({
                mobile,
            })
                .returning();
            const [newUser] = await tx
                .insert(schema_1.usersTable)
                .values({
                name,
                email,
                // mobile,
                mobileId: mobileRecord[0].id,
                address,
                username: username,
                joinDate: new Date().toISOString(),
                profilePicUrl, // Save the profilePic URL in the user table
            })
                .returning();
            if (!newUser) {
                throw new Error("Failed to create user");
            }
            // Create user info with password
            await tx.insert(schema_1.userInfoTable).values({
                userId: newUser.id,
                password: hashedPassword,
                isSuspended: false,
                activeTokenVersion: 1,
            });
            // Assign role - use specified role or default to GENERAL_USER if not provided
            const roleToAssign = role || roles_manager_1.defaultRole;
            const roleInfo = await tx.query.roleInfoTable.findFirst({
                where: (roles) => (0, drizzle_orm_1.eq)(roles.name, roleToAssign),
            });
            if (roleInfo) {
                await tx.insert(schema_1.userRolesTable).values({
                    userId: newUser.id,
                    roleId: roleInfo.id,
                    addDate: new Date().toISOString(),
                });
            }
            // Return user data
            return res.status(201).json({
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    mobile: mobileRecord[0].mobile,
                    profilePicUrl: newUser.profilePicUrl, // Include profilePic URL in the response
                },
                message: "User created successfully",
            });
        });
    }
    catch (error) {
        console.error("Signup error:", error);
        next(error instanceof api_error_1.ApiError
            ? error
            : new api_error_1.ApiError("Failed to create user account", 500));
    }
};
exports.signup = signup;
/**
 * Login a user
 */
const login = async (req, res, next) => {
    const { login, password, useUsername, expoPushToken } = req.body;
    // Validate required fields
    if (!login || !password) {
        throw new api_error_1.ApiError("Missing credentials", 400);
    }
    console.log({ useUsername });
    // Find user based on login method
    let user;
    let mobileRecord;
    if (useUsername) {
        // If useUsername flag is set, only check username
        user = await db_index_1.db.query.usersTable.findFirst({
            where: (users) => (0, drizzle_orm_1.eq)(users.username, login),
            with: {
                userInfo: true,
                mobileNumber: true,
            },
        });
    }
    else {
        mobileRecord = await db_index_1.db.query.mobileNumbersTable.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.mobileNumbersTable.mobile, login)
        });
        // Mobile number login
        user = await db_index_1.db.query.usersTable.findFirst({
            // where: (users) => eq(users.mobile, login),
            where: (0, drizzle_orm_1.eq)(schema_1.mobileNumbersTable.mobile, login),
            with: {
                userInfo: true,
                mobileNumber: true,
            },
        });
    }
    if (!user || !user.userInfo) {
        throw new api_error_1.ApiError(useUsername
            ? "Invalid username or password"
            : "Invalid mobile number or password", 401);
    }
    // Check if user is suspended
    if (user.userInfo.isSuspended) {
        throw new api_error_1.ApiError("Account has been suspended", 403);
    }
    let passwordToCompare = mobileRecord?.password;
    if (useUsername) {
        passwordToCompare = user.userInfo.password;
    }
    // Verify password
    const isPasswordValid = await bcryptjs_1.default.compare(password, passwordToCompare || '');
    if (!isPasswordValid) {
        throw new api_error_1.ApiError("Invalid credentials", 401);
    }
    // Get user roles
    // Since we don't have the proper relations set up yet for roles,
    // we'll query the role information directly
    const userRolesData = await db_index_1.db
        .select({
        roleId: schema_1.userRolesTable.roleId,
    })
        .from(schema_1.userRolesTable)
        .where((0, drizzle_orm_1.eq)(schema_1.userRolesTable.userId, user.id));
    const roleIds = userRolesData.map((ur) => ur.roleId);
    let roleNames = [];
    if (roleIds.length > 0) {
        const roles = await db_index_1.db
            .select({
            name: schema_1.roleInfoTable.name,
        })
            .from(schema_1.roleInfoTable)
            .where(roleIds.length > 1
            ? (0, drizzle_orm_1.inArray)(schema_1.roleInfoTable.id, roleIds)
            : (0, drizzle_orm_1.eq)(schema_1.roleInfoTable.id, roleIds[0]));
        roleNames = roles.map((r) => r.name);
    }
    // Generate JWT token
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        mobile: mobileRecord?.mobile,
        roles: roleNames,
        tokenVersion: user.userInfo.activeTokenVersion,
    };
    // Sign token with secret key and set expiration
    const token = jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "30d" });
    await savePushToken(user.id, expoPushToken);
    // Prepare response object
    const responseObj = {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: mobileRecord?.mobile,
            roles: roleNames,
        },
        token,
        message: "Login successful",
    };
    // Return user data with token
    return res.status(200).json(responseObj);
};
exports.login = login;
async function savePushToken(userId, pushToken) {
    if (!pushToken)
        return;
    // Check if a record exists for this userId
    const existing = await db_index_1.db.query.notifCredsTable.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.notifCredsTable.userId, userId),
    });
    if (existing) {
        // Update the pushToken
        await db_index_1.db
            .update(schema_1.notifCredsTable)
            .set({ pushToken, addedOn: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.notifCredsTable.userId, userId));
    }
    else {
        // Insert new record
        await db_index_1.db.insert(schema_1.notifCredsTable).values({ userId, pushToken });
    }
}
/**
 * Add a business user (no email/mobile, only username/password/role/name)
 */
const addBusinessUser = async (req, res, next) => {
    const { name, username, password, role, specializationIds, consultationFee, dailyTokenCount, hospitalId, description, yearsOfExperience, } = req.body;
    // Validate required fields
    if (!name || !username || !password || !role) {
        throw new api_error_1.ApiError("Missing required fields", 400);
    }
    // If role is doctor, validate specializationIds and other doctor-specific fields
    if (role === roles_manager_1.ROLE_NAMES.DOCTOR) {
        if (!specializationIds || !specializationIds.length) {
            throw new api_error_1.ApiError("Specializations are required for doctors", 400);
        }
        if (consultationFee === undefined || consultationFee === null) {
            throw new api_error_1.ApiError("Consultation fee is required for doctors", 400);
        }
        if (dailyTokenCount === undefined || dailyTokenCount === null) {
            throw new api_error_1.ApiError("Daily token count is required for doctors", 400);
        }
    }
    // Check if valid role using the role manager
    const businessRoles = await roles_manager_1.default.getBusinessRoles();
    const validRoles = businessRoles.map((r) => r.name);
    if (!validRoles.includes(role)) {
        throw new api_error_1.ApiError(`Invalid role. Must be one of: ${validRoles.join(", ")}`, 400);
    }
    // Check if user with the same username already exists
    const existingUser = await db_index_1.db.query.usersTable.findFirst({
        where: (users) => (0, drizzle_orm_1.eq)(users.username, username),
    });
    if (existingUser) {
        throw new api_error_1.ApiError("User with this username already exists", 409);
    }
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
    // Handle profilePic upload
    let profilePicUrl = null;
    if (req.file) {
        profilePicUrl = await (0, s3_client_1.imageUploadS3)(req.file.buffer, req.file.mimetype, `profile-pics/${Date.now()}_${req.file.originalname}`);
    }
    // Start a transaction
    return await db_index_1.db.transaction(async (tx) => {
        // Create a new user with username and a dummy mobile number (no email required)
        const [newUser] = await tx
            .insert(schema_1.usersTable)
            .values({
            name,
            username: username, // Store username directly in the username field
            // mobile: username + "_mobile", // Dummy mobile for uniqueness
            joinDate: new Date().toISOString(),
            profilePicUrl, // Save the profilePic URL in the user table
        })
            .returning();
        if (!newUser) {
            throw new Error("Failed to create business user");
        }
        // Create user info with password
        await tx.insert(schema_1.userInfoTable).values({
            userId: newUser.id,
            password: hashedPassword,
            isSuspended: false,
            activeTokenVersion: 1,
        });
        // Find the role using role manager
        let roleInfo = await roles_manager_1.default.getRoleByName(role);
        if (!roleInfo) {
            throw new Error("Role not found");
        }
        // Assign role to user
        await tx.insert(schema_1.userRolesTable).values({
            userId: newUser.id,
            roleId: roleInfo.id,
            addDate: new Date().toISOString(),
        });
        // If user is a doctor, create doctor info and specializations
        if (role === roles_manager_1.ROLE_NAMES.DOCTOR) {
            // Create doctor info
            const [doctorInfo] = await tx
                .insert(schema_1.doctorInfoTable)
                .values({
                userId: newUser.id,
                dailyTokenCount: dailyTokenCount || 0,
                consultationFee: consultationFee || 0,
                description,
                yearsOfExperience,
            })
                .returning();
            if (!doctorInfo) {
                throw new Error("Failed to create doctor info");
            }
            // Add doctor specializations
            if (specializationIds && specializationIds.length > 0) {
                await tx.insert(schema_1.doctorSpecializationsTable).values(specializationIds
                    .split(",")
                    .map((item) => item.trim())
                    .map((specializationId) => ({
                    doctorId: newUser.id, // Use user ID directly since doctorSpecializationsTable now references usersTable
                    specializationId,
                })));
            }
            if (Boolean(Number(hospitalId))) {
                // Add doctor to the hospital as an employee with DOCTOR designation
                await tx.insert(schema_1.hospitalEmployeesTable).values({
                    hospitalId,
                    userId: newUser.id,
                    designation: const_strings_1.DESIGNATIONS.DOCTOR,
                });
            }
        }
        // If role is hospital admin, allow optional hospitalId
        if (role === roles_manager_1.ROLE_NAMES.HOSPITAL_ADMIN && Boolean(Number(hospitalId))) {
            await tx.insert(schema_1.hospitalEmployeesTable).values({
                hospitalId,
                userId: newUser.id,
                designation: const_strings_1.DESIGNATIONS.HOSPITAL_ADMIN,
            });
        }
        // Return user data
        return res.status(201).json({
            user: {
                id: newUser.id,
                name: newUser.name,
                username,
                role,
            },
            message: "Business user created successfully",
        });
    });
};
exports.addBusinessUser = addBusinessUser;
/**
 * Get all business users
 * Business users are identified by having roles other than 'admin' or 'gen_user'
 */
const getBusinessUsers = async (req, res, next) => {
    try {
        // Get all users with their roles
        const allUsersWithRoles = await Promise.all((await db_index_1.db.query.usersTable.findMany()).map(async (user) => {
            // Get the user's role
            const userRole = await db_index_1.db.query.userRolesTable.findFirst({
                where: (userRoles) => (0, drizzle_orm_1.eq)(userRoles.userId, user.id),
            });
            // Get role info if userRole exists using the role manager
            let roleName = "Unknown";
            if (userRole) {
                const roleInfo = await roles_manager_1.default.getRoleById(userRole.roleId);
                roleName = roleInfo?.name || "Unknown";
            }
            return {
                user,
                roleName,
            };
        }));
        // Get business roles from the role manager
        const businessRoles = await roles_manager_1.default.getBusinessRoles();
        const businessRoleNames = businessRoles.map((role) => role.name);
        // Filter business users based on role
        const businessUsers = allUsersWithRoles.filter(({ roleName }) => businessRoleNames.includes(roleName));
        // Format the response
        const formattedUsers = businessUsers.map(({ user, roleName }) => {
            return {
                id: user.id,
                name: user.name,
                username: user.username || "", // Use the username field directly
                role: roleName,
                joinDate: user.joinDate,
            };
        });
        return res.status(200).json(formattedUsers);
        return res.status(200).json(formattedUsers);
    }
    catch (error) {
        console.error("Get business users error:", error);
        next(error instanceof api_error_1.ApiError
            ? error
            : new api_error_1.ApiError("Failed to fetch business users", 500));
    }
};
exports.getBusinessUsers = getBusinessUsers;
/**
 * Get potential hospital admins (users with hospital admin role who are not already assigned to a hospital)
 */
const getPotentialHospitalAdmins = async (req, res, next) => {
    try {
        // Get all users with username and include their roles directly using relations
        const usersWithRoles = await db_index_1.db.query.usersTable.findMany({
            where: (users) => (0, drizzle_orm_1.isNotNull)(users.username),
            with: {
                roles: {
                    with: {
                        role: true,
                    },
                },
            },
        });
        // Get all hospital employees
        const hospitalEmployees = await db_index_1.db.query.hospitalEmployeesTable.findMany();
        const employeeUserIds = new Set(hospitalEmployees.map((employee) => employee.userId));
        // Transform users data to include role names directly
        const usersWithRoleNames = usersWithRoles.map((user) => {
            // Extract role names from the relations
            const roleNames = user.roles.map((userRole) => userRole.role.name);
            return {
                ...user,
                roles: roleNames,
            };
        });
        // Filter for:
        // 1. Users with hospital_admin role
        // 2. Users not already assigned to a hospital
        const potentialAdmins = usersWithRoleNames.filter((user) => user.roles.includes(roles_manager_1.ROLE_NAMES.HOSPITAL_ADMIN) &&
            !employeeUserIds.has(user.id));
        // Format the response
        const formattedAdmins = potentialAdmins.map((user) => ({
            id: user.id,
            name: user.name,
            username: user.username || "",
            roles: user.roles, // Direct access to roles array
        }));
        return res.status(200).json(formattedAdmins);
    }
    catch (error) {
        console.error("Get potential hospital admins error:", error);
        next(error instanceof api_error_1.ApiError
            ? error
            : new api_error_1.ApiError("Failed to fetch potential hospital admins", 500));
    }
};
exports.getPotentialHospitalAdmins = getPotentialHospitalAdmins;
/**
 * Get potential doctor employees
 * @description Retrieves users with doctor role who are not yet assigned to a hospital
 */
const getPotentialDoctorEmployees = async (req, res, next) => {
    try {
        // Get all users with username and include their roles directly using relations
        const usersWithRoles = await db_index_1.db.query.usersTable.findMany({
            where: (users) => (0, drizzle_orm_1.isNotNull)(users.username),
            with: {
                roles: {
                    with: {
                        role: true,
                    },
                },
            },
        });
        // Get all hospital employees
        const hospitalEmployees = await db_index_1.db.query.hospitalEmployeesTable.findMany();
        const employeeUserIds = new Set(hospitalEmployees.map((employee) => employee.userId));
        // Transform users data to include role names directly
        const usersWithRoleNames = usersWithRoles.map((user) => {
            // Extract role names from the relations
            const roleNames = user.roles.map((userRole) => userRole.role.name);
            return {
                ...user,
                roles: roleNames,
            };
        });
        // Filter for:
        // 1. Users with doctor role
        // 2. Users not already assigned to a hospital
        const potentialDoctors = usersWithRoleNames.filter((user) => user.roles.includes(roles_manager_1.ROLE_NAMES.DOCTOR) && !employeeUserIds.has(user.id));
        // Format the response
        const formattedDoctors = potentialDoctors.map((user) => ({
            id: user.id,
            name: user.name,
            username: user.username || "",
            roles: user.roles, // Direct access to roles array
        }));
        return res.status(200).json(formattedDoctors);
    }
    catch (error) {
        console.error("Get potential doctor employees error:", error);
        next(error instanceof api_error_1.ApiError
            ? error
            : new api_error_1.ApiError("Failed to fetch potential doctor employees", 500));
    }
};
exports.getPotentialDoctorEmployees = getPotentialDoctorEmployees;
/**
 * Get user by ID
 * @description Retrieves user information including role and specializations if user is a doctor
 */
const getUserById = async (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
        throw new api_error_1.ApiError("Invalid user ID", 400);
    }
    // Get user with roles
    const user = await db_index_1.db.query.usersTable.findFirst({
        where: (users) => (0, drizzle_orm_1.eq)(users.id, userId),
        with: {
            roles: {
                with: {
                    role: true,
                },
            },
            mobileNumber: true,
        },
    });
    if (!user) {
        throw new api_error_1.ApiError("User not found", 404);
    }
    // Extract role names
    const roleNames = user.roles.map((r) => r.role.name);
    // Check if user is a doctor
    const isDoctor = roleNames.includes(roles_manager_1.ROLE_NAMES.DOCTOR);
    // Generate signed URL for profilePic if present
    let signedProfilePicUrl = null;
    if (user.profilePicUrl) {
        const { generateSignedUrlFromS3Url } = await Promise.resolve().then(() => __importStar(require("../lib/s3-client")));
        signedProfilePicUrl = await generateSignedUrlFromS3Url(user.profilePicUrl);
    }
    // Format base user response
    const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobileNumber?.mobile,
        username: user.username,
        address: user.address,
        profilePicUrl: signedProfilePicUrl,
        joinDate: user.joinDate,
        role: roleNames[0], // Primary role
        roles: roleNames,
    };
    // If user is a doctor, get additional info
    if (isDoctor) {
        // Get doctor info
        const doctorInfo = await db_index_1.db.query.doctorInfoTable.findFirst({
            where: (docs) => (0, drizzle_orm_1.eq)(docs.userId, userId),
        });
        const hospital = await db_index_1.db
            .select({
            hospitalName: schema_1.hospitalTable.name,
            id: schema_1.hospitalTable.id,
        })
            .from(schema_1.hospitalEmployeesTable)
            .innerJoin(schema_1.hospitalTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, schema_1.hospitalTable.id))
            .where((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, user.id));
        if (doctorInfo) {
            // Get specializations
            const specializations = await db_index_1.db.query.doctorSpecializationsTable.findMany({
                where: (specs) => (0, drizzle_orm_1.eq)(specs.doctorId, user.id), // Use user ID directly
                with: {
                    specialization: true,
                },
            });
            // Return user with doctor info
            return res.status(200).json({
                ...userResponse,
                doctorId: doctorInfo.id,
                qualifications: doctorInfo.qualifications,
                dailyTokenCount: doctorInfo.dailyTokenCount,
                consultationFee: doctorInfo.consultationFee,
                hospital: hospital[0].hospitalName,
                hospitalId: hospital[0].id,
                description: doctorInfo.description,
                yearsOfExperience: doctorInfo.yearsOfExperience,
                specializations: specializations.map((s) => ({
                    id: s.specialization.id,
                    name: s.specialization.name,
                    description: s.specialization.description,
                })),
            });
        }
    }
    // Return basic user info if not a doctor or no doctor info found
    return res.status(200).json(userResponse);
};
exports.getUserById = getUserById;
/**
 * Get doctor by ID
 * @description Retrieves doctor information including role, specializations and all related doctor-specific details
 */
const getDoctorById = async (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
        throw new api_error_1.ApiError("Invalid user ID", 400);
    }
    // Get user with roles
    const user = await db_index_1.db.query.usersTable.findFirst({
        where: (users) => (0, drizzle_orm_1.eq)(users.id, userId),
        with: {
            roles: {
                with: {
                    role: true,
                },
            },
            mobileNumber: true,
        },
    });
    if (!user) {
        throw new api_error_1.ApiError("User not found", 404);
    }
    // Extract role names
    const roleNames = user.roles.map((r) => r.role.name);
    // Check if user is a doctor
    const isDoctor = roleNames.includes(roles_manager_1.ROLE_NAMES.DOCTOR);
    if (!isDoctor) {
        throw new api_error_1.ApiError("User is not a doctor", 400);
    }
    // Generate signed URL for profilePic if present
    let signedProfilePicUrl = null;
    if (user.profilePicUrl) {
        const { generateSignedUrlFromS3Url } = await Promise.resolve().then(() => __importStar(require("../lib/s3-client")));
        signedProfilePicUrl = await generateSignedUrlFromS3Url(user.profilePicUrl);
    }
    // Get doctor info
    const doctorInfo = await db_index_1.db.query.doctorInfoTable.findFirst({
        where: (docs) => (0, drizzle_orm_1.eq)(docs.userId, userId),
    });
    if (!doctorInfo) {
        throw new api_error_1.ApiError("Doctor information not found", 404);
    }
    const hospital = await db_index_1.db
        .select({
        hospitalName: schema_1.hospitalTable.name,
        id: schema_1.hospitalTable.id,
    })
        .from(schema_1.hospitalEmployeesTable)
        .innerJoin(schema_1.hospitalTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, schema_1.hospitalTable.id))
        .where((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, user.id));
    // Get specializations
    const specializations = await db_index_1.db.query.doctorSpecializationsTable.findMany({
        where: (specs) => (0, drizzle_orm_1.eq)(specs.doctorId, user.id), // Use user ID directly
        with: {
            specialization: true,
        },
    });
    // Get today's availability to check if consultations are paused
    const today = new Date().toISOString().split("T")[0];
    const todayAvailability = await db_index_1.db.query.doctorAvailabilityTable.findFirst({
        where: (availability) => (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(availability.doctorId, user.id), (0, drizzle_orm_1.eq)(availability.date, today)),
    });
    // Format doctor response
    const doctorResponse = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobile: user.mobileNumber?.mobile,
        profilePicUrl: signedProfilePicUrl,
        address: user.address,
        joinDate: user.joinDate,
        role: roleNames[0], // Primary role
        roles: roleNames,
        doctorId: doctorInfo.id,
        qualifications: doctorInfo.qualifications,
        dailyTokenCount: doctorInfo.dailyTokenCount,
        consultationFee: doctorInfo.consultationFee,
        hospital: hospital[0]?.hospitalName,
        hospitalId: hospital[0]?.id,
        description: doctorInfo.description,
        yearsOfExperience: doctorInfo.yearsOfExperience,
        specializations: specializations.map((s) => ({
            id: s.specialization.id,
            name: s.specialization.name,
            description: s.specialization.description,
        })),
        isConsultationsPaused: todayAvailability?.isPaused || false,
        pauseReason: todayAvailability?.pauseReason || null,
    };
    return res.status(200).json(doctorResponse);
};
exports.getDoctorById = getDoctorById;
/**
 * Update user information
 * @description Updates user's basic information and doctor-specific details if applicable
 */
const updateUser = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        const { name, email, mobile, address, profilePicUrl, password, qualifications, specializationIds, consultationFee, dailyTokenCount, description, yearsOfExperience, } = req.body;
        if (isNaN(userId)) {
            throw new api_error_1.ApiError("Invalid user ID", 400);
        }
        // Verify user exists
        const existingUser = await db_index_1.db.query.usersTable.findFirst({
            where: (users) => (0, drizzle_orm_1.eq)(users.id, userId),
            with: {
                roles: {
                    with: {
                        role: true,
                    },
                },
                mobileNumber: true,
                userInfo: true,
            },
        });
        if (!existingUser) {
            throw new api_error_1.ApiError("User not found", 404);
        }
        // Check if user is trying to update to an email or mobile that already exists
        // Only perform this check if email or mobile are being updated to different values
        const emailChanged = email !== undefined && email !== null && email !== existingUser.email;
        const mobileChanged = mobile !== undefined &&
            mobile !== null &&
            mobile !== existingUser.mobileNumber?.mobile;
        if (emailChanged || mobileChanged) {
            // Build query conditions for checking conflicts
            const conflictConditions = [];
            if (emailChanged) {
                conflictConditions.push((0, drizzle_orm_1.eq)(schema_1.usersTable.email, email));
            }
            if (mobileChanged) {
                conflictConditions.push((0, drizzle_orm_1.eq)(schema_1.mobileNumbersTable.mobile, mobile));
            }
            // Check for conflicts with other users
            if (conflictConditions.length > 0) {
                const conflictingUser = await db_index_1.db.query.usersTable.findFirst({
                    where: (users) => {
                        return (0, drizzle_orm_1.and)((0, drizzle_orm_1.ne)(users.id, userId), conflictConditions.length > 1
                            ? (0, drizzle_orm_1.or)(...conflictConditions)
                            : conflictConditions[0]);
                    },
                    with: {
                        mobileNumber: true,
                    },
                });
                if (conflictingUser) {
                    throw new api_error_1.ApiError("Email or mobile number already in use", 409);
                }
            }
        }
        // Start transaction
        return await db_index_1.db.transaction(async (tx) => {
            // Prepare update object with only provided fields
            const updateData = {};
            if (name)
                updateData.name = name;
            if (email)
                updateData.email = email;
            if (mobile)
                updateData.mobile = mobile;
            if (address !== undefined)
                updateData.address = address;
            if (profilePicUrl)
                updateData.profilePicUrl = profilePicUrl;
            // Update password if provided
            if (password) {
                const saltRounds = 10;
                const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
                await tx
                    .update(schema_1.userInfoTable)
                    .set({
                    password: hashedPassword,
                    // Increment token version to invalidate existing tokens
                    activeTokenVersion: existingUser.userInfo?.activeTokenVersion
                        ? existingUser.userInfo.activeTokenVersion + 1
                        : 1,
                })
                    .where((0, drizzle_orm_1.eq)(schema_1.userInfoTable.userId, userId));
            }
            // Handle profilePic upload
            if (req.file) {
                updateData.profilePicUrl = await (0, s3_client_1.imageUploadS3)(req.file.buffer, req.file.mimetype, `profile-pics/${Date.now()}_${req.file.originalname}`);
            }
            // Update user in the database
            await tx
                .update(schema_1.usersTable)
                .set(updateData)
                .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, userId));
            // Check if user is a doctor
            const isDoctor = existingUser.roles.some((role) => role.role.name === roles_manager_1.ROLE_NAMES.DOCTOR);
            if (isDoctor) {
                // Get doctor info
                const doctorInfo = await tx.query.doctorInfoTable.findFirst({
                    where: (doctors) => (0, drizzle_orm_1.eq)(doctors.userId, userId),
                });
                if (!doctorInfo) {
                    throw new api_error_1.ApiError("Doctor information not found", 404);
                }
                // Update doctor qualifications if provided
                const doctorUpdateFields = {};
                if (qualifications !== undefined) {
                    doctorUpdateFields.qualifications = qualifications;
                }
                if (consultationFee !== undefined) {
                    doctorUpdateFields.consultationFee = consultationFee;
                }
                if (dailyTokenCount !== undefined) {
                    doctorUpdateFields.dailyTokenCount = dailyTokenCount;
                }
                if (Boolean(description)) {
                    doctorUpdateFields.description = description;
                }
                if (Boolean(yearsOfExperience)) {
                    doctorUpdateFields.yearsOfExperience = yearsOfExperience;
                }
                // Only update if there are fields to update
                if (Object.keys(doctorUpdateFields).length > 0) {
                    await tx
                        .update(schema_1.doctorInfoTable)
                        .set(doctorUpdateFields)
                        .where((0, drizzle_orm_1.eq)(schema_1.doctorInfoTable.id, doctorInfo.id));
                }
                console.log({ doctorUpdateFields });
                // Update specializations if provided
                if (specializationIds &&
                    Array.isArray(specializationIds) &&
                    specializationIds.length > 0) {
                    // First delete existing specializations
                    await tx
                        .delete(schema_1.doctorSpecializationsTable)
                        .where((0, drizzle_orm_1.eq)(schema_1.doctorSpecializationsTable.doctorId, userId)); // Use userId directly
                    // Then insert new specializations
                    await tx.insert(schema_1.doctorSpecializationsTable).values(specializationIds.map((specializationId) => ({
                        doctorId: userId, // Use userId directly
                        specializationId,
                    })));
                }
            }
            // Fetch updated user data
            const updatedUser = await getUserData(tx, userId);
            return res.status(200).json({
                ...updatedUser,
                message: "User updated successfully",
            });
        });
    }
    catch (error) {
        console.error("Update user error:", error);
        next(error instanceof api_error_1.ApiError
            ? error
            : new api_error_1.ApiError("Failed to update user", 500));
    }
};
exports.updateUser = updateUser;
/**
 * Helper function to get complete user data including role and specializations
 */
async function getUserData(db, userId) {
    // Get user with roles
    const user = await db.query.usersTable.findFirst({
        where: (users) => (0, drizzle_orm_1.eq)(users.id, userId),
        with: {
            roles: {
                with: {
                    role: true,
                },
            },
        },
    });
    if (!user) {
        throw new api_error_1.ApiError("User not found", 404);
    }
    // Extract role names
    const roleNames = user.roles.map((r) => r.role.name);
    // Check if user is a doctor
    const isDoctor = roleNames.includes(roles_manager_1.ROLE_NAMES.DOCTOR);
    // Format base user response
    const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        address: user.address,
        profilePicUrl: user.profilePicUrl,
        joinDate: user.joinDate,
        role: roleNames[0], // Primary role
        roles: roleNames,
    };
    // If user is a doctor, get additional info
    if (isDoctor) {
        // Get doctor info
        const doctorInfo = await db.query.doctorInfoTable.findFirst({
            where: (docs) => (0, drizzle_orm_1.eq)(docs.userId, userId),
        });
        if (doctorInfo) {
            // Get specializations
            const specializations = await db.query.doctorSpecializationsTable.findMany({
                where: (specs) => (0, drizzle_orm_1.eq)(specs.doctorId, doctorInfo.id),
                with: {
                    specialization: true,
                },
            });
            // Return user with doctor info
            return {
                ...userResponse,
                doctorId: doctorInfo.id,
                qualifications: doctorInfo.qualifications,
                dailyTokenCount: doctorInfo.dailyTokenCount,
                specializations: specializations.map((s) => ({
                    id: s.specialization.id,
                    name: s.specialization.name,
                    description: s.specialization.description,
                })),
            };
        }
    }
    // Return basic user info if not a doctor or no doctor info found
    return userResponse;
}
/**
 * Get user responsibilities
 * Returns information about what the user is responsible for,
 * including which hospital they are an admin for, if applicable
 * and which doctors they are a secretary for
 */
const getUserResponsibilities = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId) || req.user?.userId;
        if (!userId) {
            throw new api_error_1.ApiError("User ID is required", 400);
        }
        // Check if the user is an admin for any hospital
        const hospitalAdmin = await db_index_1.db.query.hospitalEmployeesTable.findFirst({
            where: (he) => (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(he.userId, userId), (0, drizzle_orm_1.eq)(he.designation, const_strings_1.DESIGNATIONS.HOSPITAL_ADMIN)),
        });
        // Check if the user is a secretary for any doctors
        const secretaryFor = await db_index_1.db
            .select({ doctorId: schema_1.doctorSecretariesTable.doctorId })
            .from(schema_1.doctorSecretariesTable)
            .where((0, drizzle_orm_1.eq)(schema_1.doctorSecretariesTable.secretaryId, userId));
        const response = {
            hospitalAdminFor: hospitalAdmin ? hospitalAdmin.hospitalId : null,
            secretaryFor: secretaryFor.length > 0
                ? secretaryFor.map((item) => item.doctorId)
                : [],
        };
        return res.status(200).json(response);
    }
    catch (error) {
        console.error("Error getting user responsibilities:", error);
        next(error instanceof api_error_1.ApiError
            ? error
            : new api_error_1.ApiError("Failed to get user responsibilities", 500));
    }
};
exports.getUserResponsibilities = getUserResponsibilities;
/**
 * Get user's upcoming tokens
 * Returns a list of upcoming appointments for the user
 */
const getUpcomingTokens = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new api_error_1.ApiError("User not authenticated", 401);
        }
        // Query the database for upcoming tokens
        const upcomingTokens = await db_index_1.db
            .select({
            id: schema_1.tokenInfoTable.id,
            doctorId: schema_1.tokenInfoTable.doctorId,
            tokenDate: schema_1.tokenInfoTable.tokenDate,
            queueNum: schema_1.tokenInfoTable.queueNum,
            description: schema_1.tokenInfoTable.description,
            status: schema_1.tokenInfoTable.status,
            createdAt: schema_1.tokenInfoTable.createdAt,
            doctor: {
                id: schema_1.usersTable.id,
                name: schema_1.usersTable.name,
                profilePicUrl: schema_1.usersTable.profilePicUrl,
            },
            hospital: {
                name: schema_1.hospitalTable.name,
            },
        })
            .from(schema_1.tokenInfoTable)
            .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.tokenInfoTable.doctorId, schema_1.usersTable.id))
            .innerJoin(schema_1.hospitalEmployeesTable, (0, drizzle_orm_1.eq)(schema_1.tokenInfoTable.doctorId, schema_1.hospitalEmployeesTable.userId))
            .innerJoin(schema_1.hospitalTable, (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, schema_1.hospitalTable.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tokenInfoTable.userId, userId), (0, drizzle_orm_1.eq)(schema_1.tokenInfoTable.status, "UPCOMING"), (0, drizzle_orm_1.gte)(schema_1.tokenInfoTable.tokenDate, (0, drizzle_orm_1.sql) `CURRENT_DATE`)))
            .orderBy(schema_1.tokenInfoTable.tokenDate);
        // Transform the data to match our UpcomingAppointment interface
        const upcomingAppointments = upcomingTokens.map((token) => ({
            id: token.id,
            doctorName: token.doctor.name,
            doctorImageUrl: token.doctor.profilePicUrl || undefined,
            date: token.tokenDate.toString().split("T")[0],
            hospital: token.hospital.name,
            queueNumber: token.queueNum,
            status: token.status,
        }));
        return res.status(200).json({
            appointments: upcomingAppointments,
        });
    }
    catch (error) {
        console.error("Error getting upcoming tokens:", error);
        next(error instanceof api_error_1.ApiError
            ? error
            : new api_error_1.ApiError("Failed to get upcoming tokens", 500));
    }
};
exports.getUpcomingTokens = getUpcomingTokens;
// Check if user's push token exists in notif_creds table
const hasPushToken = async (req, res) => {
    let currUser = req.user;
    if (!currUser)
        throw new api_error_1.ApiError("User Not Found");
    const record = await db_index_1.db.query.notifCredsTable.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.notifCredsTable.userId, currUser.id),
        columns: { pushToken: true },
    });
    res.json({ hasPushToken: !!(record && record.pushToken) });
};
exports.hasPushToken = hasPushToken;
// Add or update user's push token in notif_creeds table
const addPushToken = async (req, res) => {
    const { pushToken } = req.body;
    if (!pushToken) {
        throw new api_error_1.ApiError("Push token is required", 400);
    }
    const currUser = req.user;
    if (!currUser) {
        throw new api_error_1.ApiError("Unauthorized request", 401);
    }
    await savePushToken(currUser.id, pushToken);
    // // Check if a record exists for this userId
    // const existing = await db.query.notifCredsTable.findFirst({
    //   where: eq(notifCredsTable.userId, currUser.id),
    // });
    // if (existing) {
    //   await db
    //     .update(notifCredsTable)
    //     .set({ pushToken })
    //     .where(eq(notifCredsTable.userId, currUser.id));
    // } else {
    //   await db.insert(notifCredsTable).values({ userId: currUser.id, pushToken });
    // }
    res.json({ message: "Push token saved successfully" });
};
exports.addPushToken = addPushToken;
/**
 * Search for users by mobile number
 */
const searchUsersByMobile = async (req, res, next) => {
    const { mobile } = req.query;
    if (!mobile) {
        throw new api_error_1.ApiError("Mobile number is required for search", 400);
    }
    const mobileQuery = mobile;
    console.log({ mobileQuery });
    const users = await db_index_1.db
        .select({
        id: schema_1.usersTable.id,
        name: schema_1.usersTable.name,
        email: schema_1.usersTable.email,
        mobile: schema_1.mobileNumbersTable.mobile,
        age: schema_1.userInfoTable.age,
        gender: schema_1.userInfoTable.gender,
    })
        .from(schema_1.usersTable)
        .leftJoin(schema_1.userInfoTable, (0, drizzle_orm_1.eq)(schema_1.usersTable.id, schema_1.userInfoTable.userId))
        .leftJoin(schema_1.mobileNumbersTable, (0, drizzle_orm_1.eq)(schema_1.usersTable.mobileId, schema_1.mobileNumbersTable.id))
        .where((0, drizzle_orm_1.eq)(schema_1.mobileNumbersTable.mobile, mobileQuery));
    return res.status(200).json({ users: users });
};
exports.searchUsersByMobile = searchUsersByMobile;
/**
 * Get patient details by patient ID
 */
const getPatientDetails = async (req, res, next) => {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
        throw new api_error_1.ApiError("Invalid patient ID", 400);
    }
    // Get patient basic info with userInfo
    const patient = await db_index_1.db.query.usersTable.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.usersTable.id, patientId),
        with: {
            userInfo: true,
            roles: {
                with: {
                    role: true
                }
            }
        }
    });
    if (!patient) {
        throw new api_error_1.ApiError("Patient not found", 404);
    }
    // Check if user is a general user (patient)
    const isGeneralUser = patient.roles.some(r => r.role.name === roles_manager_1.ROLE_NAMES.GENERAL_USER);
    if (!isGeneralUser) {
        throw new api_error_1.ApiError("User is not a patient", 400);
    }
    // Get requesting user's hospital (must be hospital admin)
    const requestingUserId = req.user?.userId;
    if (!requestingUserId) {
        throw new api_error_1.ApiError("User not authenticated", 401);
    }
    const hospitalEmployee = await db_index_1.db.query.hospitalEmployeesTable.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.userId, requestingUserId), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.designation, const_strings_1.DESIGNATIONS.HOSPITAL_ADMIN))
    });
    if (!hospitalEmployee) {
        throw new api_error_1.ApiError("Access denied: User is not a hospital admin", 403);
    }
    const adminHospitalId = hospitalEmployee.hospitalId;
    // Get consultation history with doctor details
    const consultations = await db_index_1.db
        .select({
        id: schema_1.tokenInfoTable.id,
        tokenDate: schema_1.tokenInfoTable.tokenDate,
        doctorId: schema_1.tokenInfoTable.doctorId,
        consultationNotes: schema_1.tokenInfoTable.consultationNotes,
        doctor: {
            name: schema_1.usersTable.name
        }
    })
        .from(schema_1.tokenInfoTable)
        .innerJoin(schema_1.usersTable, (0, drizzle_orm_1.eq)(schema_1.tokenInfoTable.doctorId, schema_1.usersTable.id))
        .innerJoin(schema_1.hospitalEmployeesTable, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.usersTable.id, schema_1.hospitalEmployeesTable.userId), (0, drizzle_orm_1.eq)(schema_1.hospitalEmployeesTable.hospitalId, adminHospitalId)))
        .where((0, drizzle_orm_1.eq)(schema_1.tokenInfoTable.userId, patientId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.tokenInfoTable.tokenDate));
    // Format consultation history
    const consultationHistory = consultations.map(consultation => ({
        date: consultation.tokenDate,
        doctorDetails: {
            id: consultation.doctorId.toString(),
            name: consultation.doctor.name || 'Unknown Doctor'
        },
        notes: consultation.consultationNotes || 'No notes available'
    }));
    // Get last consultation date
    const lastConsultation = consultationHistory.length > 0 ? consultationHistory[0].date : null;
    const response = {
        name: patient.name,
        age: patient.userInfo?.age || null,
        gender: patient.userInfo?.gender || null,
        last_consultation: lastConsultation,
        consultationHistory
    };
    return res.status(200).json(response);
};
exports.getPatientDetails = getPatientDetails;
