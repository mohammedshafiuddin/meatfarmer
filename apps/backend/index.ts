import 'dotenv/config';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import { db } from './src/db/db_index';
import mainRouter from './src/main-router';
import initFunc from './src/lib/init';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './src/trpc/router';
import jwt from 'jsonwebtoken'
// import { seed } from 'src/db/seed';


const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to log all request URLs
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});


app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: ({ req, res }) => {
    let user = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      } catch (err) {
        // Invalid token, user remains null
      }
    }
    return { req, res, user };
  },
}));

app.use('/api', mainRouter)
// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

app.listen(4000, () => {
  console.log("Server is running on http://localhost:4000/api/mobile/");
});