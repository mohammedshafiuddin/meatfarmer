"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const api_error_1 = require("../lib/api-error");
const verifyToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new api_error_1.ApiError('Access denied. No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new api_error_1.ApiError('Access denied. Invalid token format', 401);
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Add user info to request
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new api_error_1.ApiError('Invalid Auth Credentials', 401));
        }
        else {
            next(error);
        }
    }
};
exports.verifyToken = verifyToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new api_error_1.ApiError('Authentication required', 401);
            }
            // Check if user has any of the required roles
            const userRoles = req.user.roles || [];
            const hasPermission = roles.some(role => userRoles.includes(role));
            if (!hasPermission) {
                throw new api_error_1.ApiError('Access denied. Insufficient permissions', 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireRole = requireRole;
