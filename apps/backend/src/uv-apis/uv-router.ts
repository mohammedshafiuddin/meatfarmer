import { Router } from "express";
import authRouter from "./auth.router";

const router = Router();

router.use("/auth", authRouter);

const uvRouter = router;
export default uvRouter;