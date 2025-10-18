"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product.controller");
const upload_handler_1 = __importDefault(require("../lib/upload-handler"));
const router = (0, express_1.Router)();
// Product routes
router.post("/", upload_handler_1.default.array('images'), product_controller_1.createProduct);
router.get("/", product_controller_1.getProducts);
router.get("/summary", product_controller_1.getAllProductsSummary);
router.get("/:id", product_controller_1.getProductById);
router.put("/:id", upload_handler_1.default.array('images'), product_controller_1.updateProduct);
router.delete("/:id", product_controller_1.deleteProduct);
// Product summary and slot association routes
router.get("/slots/:slotId/product-ids", product_controller_1.getSlotProductIds);
router.put("/slots/:slotId/products", product_controller_1.updateSlotProducts);
router.post("/slots/product-ids", product_controller_1.getSlotsProductIds);
exports.default = router;
