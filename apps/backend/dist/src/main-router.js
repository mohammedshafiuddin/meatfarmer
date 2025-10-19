"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_error_1 = require("./lib/api-error");
const v1_router_1 = __importDefault(require("./v1-router"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
router.get('/seed', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
router.use('/v1', v1_router_1.default);
// Global error handling middleware
router.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof api_error_1.ApiError) {
        return res.status(err.statusCode).json({
            error: err.message,
            details: err.details,
            statusCode: err.statusCode
        });
    }
    // Handle unknown errors
    return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        statusCode: 500
    });
});
const mainRouter = router;
exports.default = mainRouter;
