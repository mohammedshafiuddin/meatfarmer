 import { Router } from "express";
 import avRouter from "./admin-apis/av-router";
 import commonRouter from "./common-apis/common.router";
 import uvRouter from "./uv-apis/uv-router";

const router = Router();

 router.use('/av', avRouter);
 router.use('/cm', commonRouter);
 router.use('/uv', uvRouter);


const v1Router = router;

export default v1Router;