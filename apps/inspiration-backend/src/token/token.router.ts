import express from 'express';
import {
  bookToken,
  updateDoctorAvailability,
  getDoctorAvailabilityForNextDays,
  getHospitalTodaysTokens,
  getDoctorTodaysTokens,
  updateTokenStatus,
  createOfflineToken,
  createLocalToken,
  searchToken,
  getHospitalTokenHistory,
  getHospitalPatientHistory
} from './token.controller';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/token/book
 * @desc    Book a token for a doctor
 * @access  Public
 */
router.post('/book', bookToken);

/**
 * @route   POST /api/token/doctor-availability
 * @desc    Update doctor's availability for a specific date
 * @access  Public
 */
router.post('/doctor-availability', updateDoctorAvailability);

/**
 * @route   GET /api/token/doctor-availability/next-days
 * @desc    Get doctor's availability for the next 3 days
 * @access  Public
 */
router.get('/doctor-availability/next-days', getDoctorAvailabilityForNextDays);

/**
 * @route   POST /api/token/local-token
 * @desc    Create a local token for a doctor
 * @access  Private - Requires authentication
*/
router.post('/local-token', verifyToken, createLocalToken);

/**
 * @route   GET /api/token/hospital-today
 * @desc    Get today's tokens for all doctors in a hospital (hospital admin view)
 * @access  Private - Requires authentication (hospital admin only)
 */
router.get('/hospital-today', verifyToken, getHospitalTodaysTokens);

/**
 * @route   GET /api/token/doctor-today/:doctorId
 * @desc    Get today's tokens for a specific doctor
 * @access  Private - Requires authentication
 */
router.get('/doctor-today/:doctorId', verifyToken, getDoctorTodaysTokens);

/**
 * @route   PATCH /api/token/:id/status
 * @desc    Update token status
 * @access  Private - Requires authentication
 */
router.patch('/:id/status', verifyToken, updateTokenStatus);

/**
 * @route   POST /api/token/offline
 * @desc    Create an offline token for a doctor
 * @access  Private - Requires authentication (hospital admin only)
 */
router.post('/offline', verifyToken, createOfflineToken);

/**
 * @route   POST /api/token/offline
 * @desc    Create an offline token for a doctor
 * @access  Private - Requires authentication (hospital admin only)
 */
router.get('/search', verifyToken, searchToken);

/**
 * @route   GET /api/token/history
 * @desc    Get token history for doctors in the hospital (hospital admin view)
 * @access  Private - Requires authentication (hospital admin only)
 */
router.get('/history', verifyToken, getHospitalTokenHistory);

/**
 * @route   GET /api/token/patients/history
 * @desc    Get patient history for a hospital (hospital admin view)
 * @access  Private - Requires authentication (hospital admin only)
 */
router.get('/patients/history', verifyToken, getHospitalPatientHistory);

export default router;
