"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_1 = require("../middleware/auth");
const upload_handler_1 = __importDefault(require("../lib/upload-handler"));
const router = (0, express_1.Router)();
// User routes
router.post("/signup", upload_handler_1.default.single('profilePic'), user_controller_1.signup);
router.post("/login", user_controller_1.login);
router.post("/business-user", upload_handler_1.default.single('profilePic'), user_controller_1.addBusinessUser);
router.get("/business-users", user_controller_1.getBusinessUsers);
router.get("/potential-hospital-admins", user_controller_1.getPotentialHospitalAdmins);
router.get("/potential-doctor-employees", user_controller_1.getPotentialDoctorEmployees);
router.get("/search", auth_1.verifyToken, user_controller_1.searchUsersByMobile);
router.get("/user/:userId", auth_1.verifyToken, user_controller_1.getUserById);
router.get("/doctor/:userId", auth_1.verifyToken, user_controller_1.getDoctorById);
router.put("/:userId", auth_1.verifyToken, upload_handler_1.default.single('profilePic'), user_controller_1.updateUser);
router.get("/responsibilities/:userId", user_controller_1.getUserResponsibilities);
router.get("/responsibilities", auth_1.verifyToken, user_controller_1.getUserResponsibilities);
router.get("/upcoming-tokens", auth_1.verifyToken, user_controller_1.getUpcomingTokens);
router.get('/has-push-token', user_controller_1.hasPushToken);
router.post('/push-token', user_controller_1.addPushToken);
router.get("/patient-details/:patientId", auth_1.verifyToken, user_controller_1.getPatientDetails);
exports.default = router;
