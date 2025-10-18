import 'dotenv/config';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import seed from './src/db/seed';
import { db } from './src/db/db_index';
import mainRouter from './src/main-router';
import initFunc from './src/lib/init';


const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to log all request URLs
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});



app.use('/api', mainRouter)

// app.use(multer({
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10 MB
//   }
// }).any());

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
