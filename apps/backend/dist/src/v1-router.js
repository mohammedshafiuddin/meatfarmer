"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const av_router_1 = __importDefault(require("./admin-apis/av-router"));
const common_router_1 = __importDefault(require("./common-apis/common.router"));
const uv_router_1 = __importDefault(require("./uv-apis/uv-router"));
const router = (0, express_1.Router)();
router.use('/av', av_router_1.default);
router.use('/cm', common_router_1.default);
router.use('/uv', uv_router_1.default);
const v1Router = router;
exports.default = v1Router;
