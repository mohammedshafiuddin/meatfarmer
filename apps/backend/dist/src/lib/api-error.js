"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace?.(this, ApiError);
    }
}
exports.ApiError = ApiError;
