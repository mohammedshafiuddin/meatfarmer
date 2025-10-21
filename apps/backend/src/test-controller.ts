import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
  });
});

export default router;