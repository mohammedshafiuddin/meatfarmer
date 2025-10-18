"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const token_controller_1 = require("./token.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @route   POST /api/token/book
 * @desc    Book a token for a doctor
 * @access  Public
 */
router.post('/book', token_controller_1.bookToken);
/**
 * @route   POST /api/token/doctor-availability
 * @desc    Update doctor's availability for a specific date
 * @access  Public
 */
router.post('/doctor-availability', token_controller_1.updateDoctorAvailability);
/**
 * @route   GET /api/token/doctor-availability/next-days
 * @desc    Get doctor's availability for the next 3 days
 * @access  Public
 */
router.get('/doctor-availability/next-days', token_controller_1.getDoctorAvailabilityForNextDays);
/**
 * @route   POST /api/token/local-token
 * @desc    Create a local token for a doctor
 * @access  Private - Requires authentication
*/
router.post('/local-token', auth_1.verifyToken, token_controller_1.createLocalToken);
/**
 * @route   GET /api/token/hospital-today
 * @desc    Get today's tokens for all doctors in a hospital (hospital admin view)
 * @access  Private - Requires authentication (hospital admin only)
 */
router.get('/hospital-today', auth_1.verifyToken, token_controller_1.getHospitalTodaysTokens);
/**
 * @route   GET /api/token/doctor-today/:doctorId
 * @desc    Get today's tokens for a specific doctor
 * @access  Private - Requires authentication
 */
router.get('/doctor-today/:doctorId', auth_1.verifyToken, token_controller_1.getDoctorTodaysTokens);
/**
 * @route   PATCH /api/token/:id/status
 * @desc    Update token status
 * @access  Private - Requires authentication
 */
router.patch('/:id/status', auth_1.verifyToken, token_controller_1.updateTokenStatus);
/**
 * @route   POST /api/token/offline
 * @desc    Create an offline token for a doctor
 * @access  Private - Requires authentication (hospital admin only)
 */
router.post('/offline', auth_1.verifyToken, token_controller_1.createOfflineToken);
/**
 * @route   POST /api/token/offline
 * @desc    Create an offline token for a doctor
 * @access  Private - Requires authentication (hospital admin only)
 */
router.get('/search', auth_1.verifyToken, token_controller_1.searchToken);
/**
 * @route   GET /api/token/history
 * @desc    Get token history for doctors in the hospital (hospital admin view)
 * @access  Private - Requires authentication (hospital admin only)
 */
router.get('/history', auth_1.verifyToken, token_controller_1.getHospitalTokenHistory);
/**
 * @route   GET /api/token/patients/history
 * @desc    Get patient history for a hospital (hospital admin view)
 * @access  Private - Requires authentication (hospital admin only)
 */
router.get('/patients/history', auth_1.verifyToken, token_controller_1.getHospitalPatientHistory);
exports.default = router;
