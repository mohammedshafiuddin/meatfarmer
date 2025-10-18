"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_router_1 = __importDefault(require("./product/product.router"));
const delivery_slot_router_1 = __importDefault(require("./product/delivery-slot.router"));
const router = (0, express_1.Router)();
// Product routes
router.use("/products", product_router_1.default);
// Delivery slot routes
router.use("/slots", delivery_slot_router_1.default);
const v1Router = router;
exports.default = v1Router;
