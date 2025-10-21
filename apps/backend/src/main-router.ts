import { Router, Request, Response, NextFunction } from "express";
import avRouter from "./admin-apis/av-router";
import { ApiError } from "./lib/api-error";
import v1Router from "./v1-router";
import testController from "./test-controller";

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
router.get('/seed', (req:Request, res: Response) => {
    res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
})

router.use('/v1', v1Router);
router.use('/test', testController);

// Global error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
      statusCode: err.statusCode
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    statusCode: 500
  });
});

const mainRouter = router;

export default mainRouter;