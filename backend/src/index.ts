import './config/env'; // validate env vars before anything else touches them
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma from './config/prisma';
import { Prisma } from './generated/prisma/client';
import passport from './config/passport';
import authRoutes from './routes/auth';
import judgeRoutes from './routes/judge';
import stripeRoutes from './routes/stripe';
import profileRoutes from './routes/profile';
import challengeRoutes from './routes/challenges';
import usersRoutes from './routes/users';
import settingsRoutes from './routes/settings';
import leaderboardRoutes from './routes/leaderboard';
import roomsRoutes from './routes/rooms';
import { registerMatchHandlers } from './socket/match.socket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

// Behind Railway/Vercel proxies: trust the first hop so req.ip is the real
// client IP, otherwise the rate limiter keys everyone by the proxy address.
app.set('trust proxy', 1);

// CORS must be first — before helmet and everything else
const corsOptions = {
  origin: ['https://matchmood.dev', 'https://www.matchmood.dev', 'http://localhost:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Security middleware
app.use(helmet());

// Stripe webhook needs raw body — must be before express.json()
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

// Parse JSON bodies for all other routes
app.use(express.json());

// Initialize Passport (no session — we use JWT instead)
app.use(passport.initialize());

// Throttle credential endpoints: brute-force protection, and each attempt runs
// a cost-12 bcrypt hash, so this also caps the CPU-DoS surface.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

// Routes
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth', authRoutes);
app.use('/judge', judgeRoutes);
app.use('/stripe', stripeRoutes);
app.use('/profile', profileRoutes);
app.use('/challenges', challengeRoutes);
app.use('/users', usersRoutes);
app.use('/settings', settingsRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/rooms', roomsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler. Must be last and must keep all four parameters — Express
// identifies error middleware by arity, so dropping `next` silently disables it.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server and attach Socket.io
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, credentials: true },
});

// Register all socket event handlers
registerMatchHandlers(io);

httpServer.listen(PORT, async () => {
  await prisma.$connect();
  console.log(`Server running on port ${PORT}`);
  console.log('Database connected');
  console.log('Socket.io ready');
});

export default app;
