import { Router } from "express";
import authRouter from "./auth.router";
import { raiseComplaint } from "./user-rest.controller";
import uploadHandler from "src/lib/upload-handler";

const router = Router();

router.use("/auth", authRouter);
router.use("/complaints/raise", uploadHandler.array('images'),raiseComplaint)

const uvRouter = router;
export default uvRouter;