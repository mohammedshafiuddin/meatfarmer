import 'dotenv/config';
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from './src/db/db_index';
import mainRouter from './src/main-router';
import initFunc from './src/lib/init';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './src/trpc/router';
import jwt from 'jsonwebtoken'
import signedUrlCache from 'src/lib/signed-url-cache';
import { seed } from 'src/db/seed';
// import { seed } from 'src/db/seed';
import './src/jobs/jobs-index';


const app = express();

signedUrlCache.loadFromDisk();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to log all request URLs
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

//cors middleware
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow requests from any origin (for production, replace * with your domain)
  res.header('Access-Control-Allow-Origin', '*');

  // Allow specific headers clients can send
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Allow specific HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  // Allow credentials if needed (optional)
  // res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight (OPTIONS) requests quickly
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
}


app.use('/api/trpc', createExpressMiddleware({
  router: appRouter,
  createContext: async ({ req, res }) => {
    let user = null;
    let staffUser = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        // Check if this is a staff token (has staffId)
        if (decoded.staffId) {
          // This is a staff token, verify staff exists
          const { db } = await import('./src/db/db_index');
          const { staffUsers } = await import('./src/db/schema');
          const { eq } = await import('drizzle-orm');

          const staff = await db.query.staffUsers.findFirst({
            where: eq(staffUsers.id, decoded.staffId),
          });

          if (staff) {
            user=staffUser
            staffUser = {
              id: staff.id,
              name: staff.name,
            };
          }
        } else {
          // This is a regular user token
          user = decoded;
        }
      } catch (err) {
        // Invalid token, both user and staffUser remain null
      }
    }
    return { req, res, user, staffUser };
  },
}));

app.use('/api', mainRouter)

const fallbackUiDirCandidates = [
  path.resolve(__dirname, '../fallback-ui/dist'),
  path.resolve(__dirname, '../../fallback-ui/dist'),
  path.resolve(process.cwd(), '../fallback-ui/dist'),
  path.resolve(process.cwd(), './apps/fallback-ui/dist')
]

const fallbackUiDir =
  fallbackUiDirCandidates.find((candidate) => fs.existsSync(candidate)) ??
  fallbackUiDirCandidates[0]

const fallbackUiIndex = path.join(fallbackUiDir, 'index.html')
const fallbackUiMountPath = '/admin-web'

if (fs.existsSync(fallbackUiIndex)) {
  app.use(fallbackUiMountPath, express.static(fallbackUiDir))
  const fallbackUiRegex = new RegExp(
    `^${fallbackUiMountPath.replace(/\//g, '\\/')}(?:\\/.*)?$`
  )
  app.get([fallbackUiMountPath, fallbackUiRegex], (req, res) => {
    res.sendFile(fallbackUiIndex)
  })
} else {
  console.warn(`Fallback UI build not found at ${fallbackUiIndex}`)
}

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
