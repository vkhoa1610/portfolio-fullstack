import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { RequestLogger } from '../common/util/RequestLogger.js';
import { ResponseLogger } from '../common/util/ResponseLogger.js';
import { extractTokens } from '../common/middleware/auth-middleware.js';
import { createApp } from './app.js';

const mainApp = express();

// Health check endpoint
mainApp.get('/healthcheck', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * CORS Configuration
 * 
 * In production with nginx reverse proxy:
 * - Frontend and BFF are same-origin (through nginx)
 * - CORS is not needed
 * - Cookies with SameSite=Strict work perfectly
 * 
 * In development (direct access without nginx):
 * - Enable CORS with credentials for local development
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

// if (isDevelopment) {
//   mainApp.use(
//     cors({
//       origin: ['http://localhost:3000', 'http://localhost:3001'],
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//       allowedHeaders: ['Content-Type', 'Authorization'],
//       credentials: true, // CRITICAL: Required for cookies
//     }),
//   );
// }

// Parse cookies from requests (REQUIRED for auth)
mainApp.use(cookieParser());

// Request/Response logging
mainApp.use(RequestLogger, ResponseLogger);

// Extract auth tokens from cookies (global middleware)
mainApp.use(extractTokens);

// Mount the main app with routes
const app = createApp();
mainApp.use(app);

const PORT = process.env.PORT || 4000;
mainApp.listen(PORT, () => {
  console.log(`🚀 BFF listening at http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS: ${isDevelopment ? 'Enabled for development' : 'Disabled (same-origin via nginx)'}`);
});
