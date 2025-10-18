"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.phonepeAxios = void 0;
const axios_1 = __importDefault(require("axios"));
const env_exporter_1 = require("./env-exporter");
exports.phonepeAxios = axios_1.default.create({
    baseURL: env_exporter_1.phonePeBaseUrl,
    timeout: 40000,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
    },
});
