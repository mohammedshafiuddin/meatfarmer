import { Router } from "express";
import { createTag, getAllTags, getTagById, updateTag, deleteTag } from "./product-tags.controller";
import uploadHandler from '../lib/upload-handler';

const router = Router();

// Tag routes
router.post("/", uploadHandler.single('image'), createTag);
router.get("/", getAllTags);
router.get("/:id", getTagById);
router.put("/:id", uploadHandler.single('image'), updateTag);
router.delete("/:id", deleteTag);

export default router;