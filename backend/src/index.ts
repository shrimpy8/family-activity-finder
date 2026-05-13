// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { logger } from './shared/logger';
import recommendRouter from './routes/recommend';

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiter: 10 requests per 15 minutes per IP.
// Uses the default in-memory store — in a multi-instance deploy each instance has
// its own counter, giving N*10 effective requests per IP. For production multi-instance
// deployments, swap the store for rate-limit-redis.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: false
}));
app.use(express.json({ limit: '10kb' }));

// Apply rate limiter to API routes
app.use('/api/', limiter);

// Health check endpoint — intentionally outside the rate limiter so load balancers
// and monitoring probes can always reach it without consuming the IP quota.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', recommendRouter);

// Start server
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});

// Graceful shutdown: finish in-flight requests before exiting
const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
