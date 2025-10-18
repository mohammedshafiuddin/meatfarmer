"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const specialization_controller_js_1 = require("./specialization.controller.js");
const router = (0, express_1.Router)();
// GET /api/v1/specializations
router.get('/', specialization_controller_js_1.getAllSpecializations);
const specializationRouter = router;
exports.default = specializationRouter;
