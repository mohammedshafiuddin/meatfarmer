"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hospital_controller_1 = require("./hospital.controller");
const auth_1 = require("../middleware/auth");
const upload_handler_1 = __importDefault(require("../lib/upload-handler"));
const router = (0, express_1.Router)();
// Hospital routes
router.post("/", upload_handler_1.default.array('hospitalImages'), hospital_controller_1.createHospital);
router.get("/", hospital_controller_1.getHospitals);
// Hospital admin specific routes
router.get("/admin-dashboard/:hospitalId", auth_1.verifyToken, hospital_controller_1.getHospitalAdminDashboard);
// Hospital doctors route
router.get("/:hospitalId/doctors", hospital_controller_1.getHospitalDoctors);
// Generic hospital routes with parameters
router.get("/:id", hospital_controller_1.getHospitalById);
router.put("/:id", upload_handler_1.default.array('hospitalImages'), hospital_controller_1.updateHospital);
router.delete("/:id", hospital_controller_1.deleteHospital);
exports.default = router;
