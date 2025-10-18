import { Request, Response, NextFunction } from "express";
import { db } from "../db/db_index";
import {
  usersTable,
  userInfoTable,
  userRolesTable,
  roleInfoTable,
  hospitalEmployeesTable,
  doctorInfoTable,
  doctorSpecializationsTable,
  doctorSecretariesTable,
  hospitalTable,
  tokenInfoTable,
  notifCredsTable,
  doctorAvailabilityTable,
  mobileNumbersTable,
} from "../db/schema";
import bcrypt from "bcryptjs";
import {
  eq,
  and,
  or,
  inArray,
  isNotNull,
  ne,
  gte,
  sql,
  like,
  desc,
} from "drizzle-orm";
import { ApiError } from "../lib/api-error";
import jwt from "jsonwebtoken";
import roleManager, { ROLE_NAMES, defaultRole } from "../lib/roles-manager";
import { DESIGNATIONS } from "../lib/const-strings";
import { imageUploadS3 } from "../lib/s3-client";
import fs from "fs";
import dayjs from "dayjs";

/**
 * Register a new user
 */
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, mobile, address, password, role, username } = req.body;
    // Parse and log profilePic
    let profilePicUrl = null;
    if (req.file) {
      // Upload to S3 using buffer
      const key = `profile-pics/${Date.now()}_${req.file.originalname}`;
      profilePicUrl = await imageUploadS3(
        req.file.buffer,
        req.file.mimetype,
        key
      );
    }

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      throw new ApiError("Missing required fields", 400);
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
    const existingUser = await db
      .select()
      .from(usersTable)
      .leftJoin(
        mobileNumbersTable,
        eq(mobileNumbersTable.id, usersTable.mobileId)
      )
      .where(eq(mobileNumbersTable.mobile, mobile))

    if (existingUser) {
      throw new ApiError(
        "User with this email, mobile, or username already exists",
        409
      );
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create a new user
      const mobileRecord = await tx
        .insert(mobileNumbersTable)
        .values({
          mobile,
        })
        .returning();
      const [newUser] = await tx
        .insert(usersTable)
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
      await tx.insert(userInfoTable).values({
        userId: newUser.id,
        password: hashedPassword,
        isSuspended: false,
        activeTokenVersion: 1,
      });

      // Assign role - use specified role or default to GENERAL_USER if not provided
      const roleToAssign = role || defaultRole;

      const roleInfo = await tx.query.roleInfoTable.findFirst({
        where: (roles) => eq(roles.name, roleToAssign),
      });

      if (roleInfo) {
        await tx.insert(userRolesTable).values({
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
  } catch (error) {
    console.error("Signup error:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError("Failed to create user account", 500)
    );
  }
};

/**
 * Login a user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { login, password, useUsername, expoPushToken } = req.body;

  // Validate required fields
  if (!login || !password) {
    throw new ApiError("Missing credentials", 400);
  }

  console.log({useUsername})
  
  // Find user based on login method
  let user;
  let mobileRecord;
  if (useUsername) {
    // If useUsername flag is set, only check username
    user = await db.query.usersTable.findFirst({
      where: (users) => eq(users.username, login),
      with: {
        userInfo: true,
        mobileNumber: true,
      },
    });
  } else {
    mobileRecord = await db.query.mobileNumbersTable.findFirst({
      where: eq(mobileNumbersTable.mobile, login)
    })
    // Mobile number login
    user = await db.query.usersTable.findFirst({
      // where: (users) => eq(users.mobile, login),
      where: eq(mobileNumbersTable.mobile, login),
      with: {
        userInfo: true,
        mobileNumber: true,
      },
    });
  }

  if (!user || !user.userInfo) {
    throw new ApiError(
      useUsername
        ? "Invalid username or password"
        : "Invalid mobile number or password",
      401
    );
  }

  // Check if user is suspended
  if (user.userInfo.isSuspended) {
    throw new ApiError("Account has been suspended", 403);
  }

  let passwordToCompare = mobileRecord?.password;
  if(useUsername) {
    passwordToCompare = user.userInfo.password;
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(
    password,
    passwordToCompare || ''
  );
  if (!isPasswordValid) {
    throw new ApiError("Invalid credentials", 401);
  }

  // Get user roles
  // Since we don't have the proper relations set up yet for roles,
  // we'll query the role information directly
  const userRolesData = await db
    .select({
      roleId: userRolesTable.roleId,
    })
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, user.id));

  const roleIds = userRolesData.map((ur) => ur.roleId);

  let roleNames: string[] = [];
  if (roleIds.length > 0) {
    const roles = await db
      .select({
        name: roleInfoTable.name,
      })
      .from(roleInfoTable)
      .where(
        roleIds.length > 1
          ? inArray(roleInfoTable.id, roleIds)
          : eq(roleInfoTable.id, roleIds[0])
      );

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
  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "30d" }
  );

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

async function savePushToken(userId: number, pushToken: string) {
  if (!pushToken) return;

  // Check if a record exists for this userId
  const existing = await db.query.notifCredsTable.findFirst({
    where: eq(notifCredsTable.userId, userId),
  });
  if (existing) {
    // Update the pushToken
    await db
      .update(notifCredsTable)
      .set({ pushToken, addedOn: new Date() })
      .where(eq(notifCredsTable.userId, userId));
  } else {
    // Insert new record
    await db.insert(notifCredsTable).values({ userId, pushToken });
  }
}

/**
 * Add a business user (no email/mobile, only username/password/role/name)
 */
export const addBusinessUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    username,
    password,
    role,
    specializationIds,
    consultationFee,
    dailyTokenCount,
    hospitalId,
    description,
    yearsOfExperience,
  } = req.body;

  // Validate required fields
  if (!name || !username || !password || !role) {
    throw new ApiError("Missing required fields", 400);
  }

  // If role is doctor, validate specializationIds and other doctor-specific fields
  if (role === ROLE_NAMES.DOCTOR) {
    if (!specializationIds || !specializationIds.length) {
      throw new ApiError("Specializations are required for doctors", 400);
    }

    if (consultationFee === undefined || consultationFee === null) {
      throw new ApiError("Consultation fee is required for doctors", 400);
    }

    if (dailyTokenCount === undefined || dailyTokenCount === null) {
      throw new ApiError("Daily token count is required for doctors", 400);
    }
  }

  // Check if valid role using the role manager
  const businessRoles = await roleManager.getBusinessRoles();
  const validRoles = businessRoles.map((r) => r.name);

  if (!validRoles.includes(role)) {
    throw new ApiError(
      `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      400
    );
  }

  // Check if user with the same username already exists
  const existingUser = await db.query.usersTable.findFirst({
    where: (users) => eq(users.username, username),
  });

  if (existingUser) {
    throw new ApiError("User with this username already exists", 409);
  }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Handle profilePic upload
  let profilePicUrl = null;
  if (req.file) {
    profilePicUrl = await imageUploadS3(
      req.file.buffer,
      req.file.mimetype,
      `profile-pics/${Date.now()}_${req.file.originalname}`
    );
  }

  // Start a transaction
  return await db.transaction(async (tx) => {
    // Create a new user with username and a dummy mobile number (no email required)
    const [newUser] = await tx
      .insert(usersTable)
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
    await tx.insert(userInfoTable).values({
      userId: newUser.id,
      password: hashedPassword,
      isSuspended: false,
      activeTokenVersion: 1,
    });

    // Find the role using role manager
    let roleInfo = await roleManager.getRoleByName(role);

    if (!roleInfo) {
      throw new Error("Role not found");
    }

    // Assign role to user
    await tx.insert(userRolesTable).values({
      userId: newUser.id,
      roleId: roleInfo.id,
      addDate: new Date().toISOString(),
    });

    // If user is a doctor, create doctor info and specializations
    if (role === ROLE_NAMES.DOCTOR) {
      // Create doctor info
      const [doctorInfo] = await tx
        .insert(doctorInfoTable)
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
        await tx.insert(doctorSpecializationsTable).values(
          specializationIds
            .split(",")
            .map((item: string) => item.trim())
            .map((specializationId: number) => ({
              doctorId: newUser.id, // Use user ID directly since doctorSpecializationsTable now references usersTable
              specializationId,
            }))
        );
      }

      if (Boolean(Number(hospitalId))) {
        // Add doctor to the hospital as an employee with DOCTOR designation
        await tx.insert(hospitalEmployeesTable).values({
          hospitalId,
          userId: newUser.id,
          designation: DESIGNATIONS.DOCTOR,
        });
      }
    }

    // If role is hospital admin, allow optional hospitalId
    if (role === ROLE_NAMES.HOSPITAL_ADMIN && Boolean(Number(hospitalId))) {
      await tx.insert(hospitalEmployeesTable).values({
        hospitalId,
        userId: newUser.id,
        designation: DESIGNATIONS.HOSPITAL_ADMIN,
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

/**
 * Get all business users
 * Business users are identified by having roles other than 'admin' or 'gen_user'
 */
export const getBusinessUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all users with their roles
    const allUsersWithRoles = await Promise.all(
      (
        await db.query.usersTable.findMany()
      ).map(async (user) => {
        // Get the user's role
        const userRole = await db.query.userRolesTable.findFirst({
          where: (userRoles) => eq(userRoles.userId, user.id),
        });

        // Get role info if userRole exists using the role manager
        let roleName = "Unknown";
        if (userRole) {
          const roleInfo = await roleManager.getRoleById(userRole.roleId);
          roleName = roleInfo?.name || "Unknown";
        }

        return {
          user,
          roleName,
        };
      })
    );

    // Get business roles from the role manager
    const businessRoles = await roleManager.getBusinessRoles();
    const businessRoleNames = businessRoles.map((role) => role.name);

    // Filter business users based on role
    const businessUsers = allUsersWithRoles.filter(({ roleName }) =>
      businessRoleNames.includes(roleName)
    );

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
  } catch (error) {
    console.error("Get business users error:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError("Failed to fetch business users", 500)
    );
  }
};

/**
 * Get potential hospital admins (users with hospital admin role who are not already assigned to a hospital)
 */
export const getPotentialHospitalAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all users with username and include their roles directly using relations
    const usersWithRoles = await db.query.usersTable.findMany({
      where: (users) => isNotNull(users.username),
      with: {
        roles: {
          with: {
            role: true,
          },
        },
      },
    });

    // Get all hospital employees
    const hospitalEmployees = await db.query.hospitalEmployeesTable.findMany();
    const employeeUserIds = new Set(
      hospitalEmployees.map((employee) => employee.userId)
    );

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
    const potentialAdmins = usersWithRoleNames.filter(
      (user) =>
        user.roles.includes(ROLE_NAMES.HOSPITAL_ADMIN) &&
        !employeeUserIds.has(user.id)
    );

    // Format the response
    const formattedAdmins = potentialAdmins.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username || "",
      roles: user.roles, // Direct access to roles array
    }));

    return res.status(200).json(formattedAdmins);
  } catch (error) {
    console.error("Get potential hospital admins error:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError("Failed to fetch potential hospital admins", 500)
    );
  }
};

/**
 * Get potential doctor employees
 * @description Retrieves users with doctor role who are not yet assigned to a hospital
 */
export const getPotentialDoctorEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all users with username and include their roles directly using relations
    const usersWithRoles = await db.query.usersTable.findMany({
      where: (users) => isNotNull(users.username),
      with: {
        roles: {
          with: {
            role: true,
          },
        },
      },
    });

    // Get all hospital employees
    const hospitalEmployees = await db.query.hospitalEmployeesTable.findMany();
    const employeeUserIds = new Set(
      hospitalEmployees.map((employee) => employee.userId)
    );

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
    const potentialDoctors = usersWithRoleNames.filter(
      (user) =>
        user.roles.includes(ROLE_NAMES.DOCTOR) && !employeeUserIds.has(user.id)
    );

    // Format the response
    const formattedDoctors = potentialDoctors.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username || "",
      roles: user.roles, // Direct access to roles array
    }));

    return res.status(200).json(formattedDoctors);
  } catch (error) {
    console.error("Get potential doctor employees error:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError("Failed to fetch potential doctor employees", 500)
    );
  }
};

/**
 * Get user by ID
 * @description Retrieves user information including role and specializations if user is a doctor
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    throw new ApiError("Invalid user ID", 400);
  }

  // Get user with roles
  const user = await db.query.usersTable.findFirst({
    where: (users) => eq(users.id, userId),
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
    throw new ApiError("User not found", 404);
  }

  // Extract role names
  const roleNames = user.roles.map((r) => r.role.name);

  // Check if user is a doctor
  const isDoctor = roleNames.includes(ROLE_NAMES.DOCTOR);

  // Generate signed URL for profilePic if present
  let signedProfilePicUrl = null;
  if (user.profilePicUrl) {
    const { generateSignedUrlFromS3Url } = await import("../lib/s3-client");
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
    const doctorInfo = await db.query.doctorInfoTable.findFirst({
      where: (docs) => eq(docs.userId, userId),
    });
    const hospital = await db
      .select({
        hospitalName: hospitalTable.name,
        id: hospitalTable.id,
      })
      .from(hospitalEmployeesTable)
      .innerJoin(
        hospitalTable,
        eq(hospitalEmployeesTable.hospitalId, hospitalTable.id)
      )
      .where(eq(hospitalEmployeesTable.userId, user.id));

    if (doctorInfo) {
      // Get specializations
      const specializations =
        await db.query.doctorSpecializationsTable.findMany({
          where: (specs) => eq(specs.doctorId, user.id), // Use user ID directly
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

/**
 * Get doctor by ID
 * @description Retrieves doctor information including role, specializations and all related doctor-specific details
 */
export const getDoctorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    throw new ApiError("Invalid user ID", 400);
  }

  // Get user with roles
  const user = await db.query.usersTable.findFirst({
    where: (users) => eq(users.id, userId),
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
    throw new ApiError("User not found", 404);
  }

  // Extract role names
  const roleNames = user.roles.map((r) => r.role.name);

  // Check if user is a doctor
  const isDoctor = roleNames.includes(ROLE_NAMES.DOCTOR);

  if (!isDoctor) {
    throw new ApiError("User is not a doctor", 400);
  }

  // Generate signed URL for profilePic if present
  let signedProfilePicUrl = null;
  if (user.profilePicUrl) {
    const { generateSignedUrlFromS3Url } = await import("../lib/s3-client");
    signedProfilePicUrl = await generateSignedUrlFromS3Url(user.profilePicUrl);
  }

  // Get doctor info
  const doctorInfo = await db.query.doctorInfoTable.findFirst({
    where: (docs) => eq(docs.userId, userId),
  });

  if (!doctorInfo) {
    throw new ApiError("Doctor information not found", 404);
  }

  const hospital = await db
    .select({
      hospitalName: hospitalTable.name,
      id: hospitalTable.id,
    })
    .from(hospitalEmployeesTable)
    .innerJoin(
      hospitalTable,
      eq(hospitalEmployeesTable.hospitalId, hospitalTable.id)
    )
    .where(eq(hospitalEmployeesTable.userId, user.id));

  // Get specializations
  const specializations = await db.query.doctorSpecializationsTable.findMany({
    where: (specs) => eq(specs.doctorId, user.id), // Use user ID directly
    with: {
      specialization: true,
    },
  });

  // Get today's availability to check if consultations are paused
  const today = new Date().toISOString().split("T")[0];
  const todayAvailability = await db.query.doctorAvailabilityTable.findFirst({
    where: (availability) =>
      and(eq(availability.doctorId, user.id), eq(availability.date, today)),
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

/**
 * Update user information
 * @description Updates user's basic information and doctor-specific details if applicable
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.params.userId);
    const {
      name,
      email,
      mobile,
      address,
      profilePicUrl,
      password,
      qualifications,
      specializationIds,
      consultationFee,
      dailyTokenCount,
      description,
      yearsOfExperience,
    } = req.body;

    if (isNaN(userId)) {
      throw new ApiError("Invalid user ID", 400);
    }

    // Verify user exists
    const existingUser = await db.query.usersTable.findFirst({
      where: (users) => eq(users.id, userId),
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
      throw new ApiError("User not found", 404);
    }

    // Check if user is trying to update to an email or mobile that already exists
    // Only perform this check if email or mobile are being updated to different values
    const emailChanged =
      email !== undefined && email !== null && email !== existingUser.email;
    const mobileChanged =
      mobile !== undefined &&
      mobile !== null &&
      mobile !== existingUser.mobileNumber?.mobile;

    if (emailChanged || mobileChanged) {
      // Build query conditions for checking conflicts
      const conflictConditions: any[] = [];

      if (emailChanged) {
        conflictConditions.push(eq(usersTable.email, email));
      }

      if (mobileChanged) {
        conflictConditions.push(eq(mobileNumbersTable.mobile, mobile));
      }

      // Check for conflicts with other users
      if (conflictConditions.length > 0) {
        const conflictingUser = await db.query.usersTable.findFirst({
          where: (users) => {
            return and(
              ne(users.id, userId),
              conflictConditions.length > 1
                ? or(...conflictConditions)
                : conflictConditions[0]
            );
          },
          with: {
            mobileNumber: true,
          },
        });

        if (conflictingUser) {
          throw new ApiError("Email or mobile number already in use", 409);
        }
      }
    }

    // Start transaction
    return await db.transaction(async (tx) => {
      // Prepare update object with only provided fields
      const updateData: Record<string, any> = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (mobile) updateData.mobile = mobile;
      if (address !== undefined) updateData.address = address;
      if (profilePicUrl) updateData.profilePicUrl = profilePicUrl;

      // Update password if provided
      if (password) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await tx
          .update(userInfoTable)
          .set({
            password: hashedPassword,
            // Increment token version to invalidate existing tokens
            activeTokenVersion: existingUser.userInfo?.activeTokenVersion
              ? existingUser.userInfo.activeTokenVersion + 1
              : 1,
          })
          .where(eq(userInfoTable.userId, userId));
      }

      // Handle profilePic upload
      if (req.file) {
        updateData.profilePicUrl = await imageUploadS3(
          req.file.buffer,
          req.file.mimetype,
          `profile-pics/${Date.now()}_${req.file.originalname}`
        );
      }

      // Update user in the database
      await tx
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, userId));

      // Check if user is a doctor
      const isDoctor = existingUser.roles.some(
        (role) => role.role.name === ROLE_NAMES.DOCTOR
      );

      if (isDoctor) {
        // Get doctor info
        const doctorInfo = await tx.query.doctorInfoTable.findFirst({
          where: (doctors) => eq(doctors.userId, userId),
        });

        if (!doctorInfo) {
          throw new ApiError("Doctor information not found", 404);
        }

        // Update doctor qualifications if provided
        const doctorUpdateFields: Record<string, any> = {};

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
            .update(doctorInfoTable)
            .set(doctorUpdateFields)
            .where(eq(doctorInfoTable.id, doctorInfo.id));
        }
        console.log({ doctorUpdateFields });

        // Update specializations if provided
        if (
          specializationIds &&
          Array.isArray(specializationIds) &&
          specializationIds.length > 0
        ) {
          // First delete existing specializations
          await tx
            .delete(doctorSpecializationsTable)
            .where(eq(doctorSpecializationsTable.doctorId, userId)); // Use userId directly

          // Then insert new specializations
          await tx.insert(doctorSpecializationsTable).values(
            specializationIds.map((specializationId: number) => ({
              doctorId: userId, // Use userId directly
              specializationId,
            }))
          );
        }
      }

      // Fetch updated user data
      const updatedUser = await getUserData(tx, userId);

      return res.status(200).json({
        ...updatedUser,
        message: "User updated successfully",
      });
    });
  } catch (error) {
    console.error("Update user error:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError("Failed to update user", 500)
    );
  }
};

/**
 * Helper function to get complete user data including role and specializations
 */
async function getUserData(db: any, userId: number) {
  // Get user with roles
  const user = await db.query.usersTable.findFirst({
    where: (users: any) => eq(users.id, userId),
    with: {
      roles: {
        with: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // Extract role names
  const roleNames = user.roles.map((r: any) => r.role.name);

  // Check if user is a doctor
  const isDoctor = roleNames.includes(ROLE_NAMES.DOCTOR);

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
      where: (docs: any) => eq(docs.userId, userId),
    });

    if (doctorInfo) {
      // Get specializations
      const specializations =
        await db.query.doctorSpecializationsTable.findMany({
          where: (specs: any) => eq(specs.doctorId, doctorInfo.id),
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
        specializations: specializations.map((s: any) => ({
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
export const getUserResponsibilities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.params.userId) || req.user?.userId;

    if (!userId) {
      throw new ApiError("User ID is required", 400);
    }

    // Check if the user is an admin for any hospital
    const hospitalAdmin = await db.query.hospitalEmployeesTable.findFirst({
      where: (he) =>
        and(
          eq(he.userId, userId),
          eq(he.designation, DESIGNATIONS.HOSPITAL_ADMIN)
        ),
    });

    // Check if the user is a secretary for any doctors
    const secretaryFor = await db
      .select({ doctorId: doctorSecretariesTable.doctorId })
      .from(doctorSecretariesTable)
      .where(eq(doctorSecretariesTable.secretaryId, userId));

    const response = {
      hospitalAdminFor: hospitalAdmin ? hospitalAdmin.hospitalId : null,
      secretaryFor:
        secretaryFor.length > 0
          ? secretaryFor.map((item) => item.doctorId)
          : [],
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error getting user responsibilities:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError("Failed to get user responsibilities", 500)
    );
  }
};

/**
 * Get user's upcoming tokens
 * Returns a list of upcoming appointments for the user
 */
export const getUpcomingTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError("User not authenticated", 401);
    }

    // Query the database for upcoming tokens
    const upcomingTokens = await db
      .select({
        id: tokenInfoTable.id,
        doctorId: tokenInfoTable.doctorId,
        tokenDate: tokenInfoTable.tokenDate,
        queueNum: tokenInfoTable.queueNum,
        description: tokenInfoTable.description,
        status: tokenInfoTable.status,
        createdAt: tokenInfoTable.createdAt,
        doctor: {
          id: usersTable.id,
          name: usersTable.name,
          profilePicUrl: usersTable.profilePicUrl,
        },
        hospital: {
          name: hospitalTable.name,
        },
      })
      .from(tokenInfoTable)
      .innerJoin(usersTable, eq(tokenInfoTable.doctorId, usersTable.id))
      .innerJoin(
        hospitalEmployeesTable,
        eq(tokenInfoTable.doctorId, hospitalEmployeesTable.userId)
      )
      .innerJoin(
        hospitalTable,
        eq(hospitalEmployeesTable.hospitalId, hospitalTable.id)
      )
      .where(
        and(
          eq(tokenInfoTable.userId, userId),
          eq(tokenInfoTable.status, "UPCOMING"),
          gte(tokenInfoTable.tokenDate, sql`CURRENT_DATE`)
        )
      )
      .orderBy(tokenInfoTable.tokenDate);

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
  } catch (error) {
    console.error("Error getting upcoming tokens:", error);
    next(
      error instanceof ApiError
        ? error
        : new ApiError("Failed to get upcoming tokens", 500)
    );
  }
};

// Check if user's push token exists in notif_creds table
export const hasPushToken = async (req: Request, res: Response) => {
  let currUser = req.user;
  if (!currUser) throw new ApiError("User Not Found");

  const record = await db.query.notifCredsTable.findFirst({
    where: eq(notifCredsTable.userId, currUser.id),
    columns: { pushToken: true },
  });
  res.json({ hasPushToken: !!(record && record.pushToken) });
};

// Add or update user's push token in notif_creeds table
export const addPushToken = async (req: Request, res: Response) => {
  const { pushToken } = req.body;
  if (!pushToken) {
    throw new ApiError("Push token is required", 400);
  }
  const currUser = req.user;
  if (!currUser) {
    throw new ApiError("Unauthorized request", 401);
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

/**
 * Search for users by mobile number
 */
export const searchUsersByMobile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { mobile } = req.query;

  if (!mobile) {
    throw new ApiError("Mobile number is required for search", 400);
  }

  const mobileQuery = mobile as string;
  console.log({ mobileQuery });

  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      mobile: mobileNumbersTable.mobile,
      age: userInfoTable.age,
      gender: userInfoTable.gender,
    })
    .from(usersTable)
    .leftJoin(userInfoTable, eq(usersTable.id, userInfoTable.userId))
    .leftJoin(
      mobileNumbersTable,
      eq(usersTable.mobileId, mobileNumbersTable.id)
    )
    .where(eq(mobileNumbersTable.mobile, mobileQuery));

  return res.status(200).json({ users: users });
};

/**
 * Get patient details by patient ID
 */
export const getPatientDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const patientId = parseInt(req.params.patientId);

  if (isNaN(patientId)) {
    throw new ApiError("Invalid patient ID", 400);
  }

  // Get requesting user's hospital (must be hospital admin)
  const requestingUserId = req.user?.userId;
  if (!requestingUserId) {
    throw new ApiError("User not authenticated", 401);
  }

  const hospitalEmployee = await db.query.hospitalEmployeesTable.findFirst({
    where: and(
      eq(hospitalEmployeesTable.userId, requestingUserId),
      eq(hospitalEmployeesTable.designation, DESIGNATIONS.HOSPITAL_ADMIN)
    )
  });

  if (!hospitalEmployee) {
    throw new ApiError("Access denied: User is not a hospital admin", 403);
  }

  const adminHospitalId = hospitalEmployee.hospitalId;

  // Get patient basic info with userInfo
  const patient = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, patientId),
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
    throw new ApiError("Patient not found", 404);
  }

  // Check if user is a general user (patient)
  const isGeneralUser = patient.roles.some(r => r.role.name === ROLE_NAMES.GENERAL_USER);
  if (!isGeneralUser) {
    throw new ApiError("User is not a patient", 400);
  }

  // Get consultation history with doctor details, filtered by hospital
  const consultations = await db
    .select({
      id: tokenInfoTable.id,
      tokenDate: tokenInfoTable.tokenDate,
      doctorId: tokenInfoTable.doctorId,
      consultationNotes: tokenInfoTable.consultationNotes,
      doctor: {
        name: usersTable.name
      }
    })
    .from(tokenInfoTable)
    .innerJoin(usersTable, eq(tokenInfoTable.doctorId, usersTable.id))
    .innerJoin(
      hospitalEmployeesTable,
      and(
        eq(usersTable.id, hospitalEmployeesTable.userId),
        eq(hospitalEmployeesTable.hospitalId, adminHospitalId)
      )
    )
    .where(eq(tokenInfoTable.userId, patientId))
    .orderBy(desc(tokenInfoTable.tokenDate));

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
