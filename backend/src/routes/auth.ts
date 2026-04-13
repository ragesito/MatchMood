import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { requireAuth, JwtPayload } from '../middleware/auth';
import prisma from '../config/prisma';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId: string, username: string): string {
  return jwt.sign(
    { userId, username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

const ME_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
  email: true,
  tier: true,
  rating: true,
  wins: true,
  losses: true,
  draws: true,
  setupCompleted: true,
  preferredLang: true,
  skillLevel: true,
  currentStreak: true,
  longestStreak: true,
  lastPlayedDate: true,
  theme: true,
  notifMatches: true,
  notifSummary: true,
  notifMilestone: true,
  createdAt: true,
  githubId: true,       // expose so frontend knows if GitHub is linked
  githubUsername: true, // the actual GitHub handle (separate from MatchMood username)
} as const;

// ── GitHub OAuth ──────────────────────────────────────────────────────────────

router.get('/github', passport.authenticate('github', { session: false }));

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/auth/failure' }),
  (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const token = signToken(user.userId, user.username);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

router.get('/failure', (_req: Request, res: Response) => {
  res.status(401).json({ error: 'GitHub authentication failed' });
});

// ── Email / Password ──────────────────────────────────────────────────────────

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Generate a unique temp username — onboarding will replace it
  let tempUsername: string;
  do {
    tempUsername = `user_${Math.random().toString(36).slice(2, 9)}`;
  } while (await prisma.user.findUnique({ where: { username: tempUsername } }));

  const user = await prisma.user.create({
    data: {
      username: tempUsername,
      email,
      passwordHash,
      setupCompleted: false,
    },
  });

  const token = signToken(user.id, user.username);
  res.status(201).json({ token });
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(401).json({ error: 'No account found with that email' });
    return;
  }

  if (!user.passwordHash) {
    // Account exists but was created via GitHub — guide the user
    res.status(401).json({ error: 'This account uses GitHub login. Please sign in with GitHub.' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  const token = signToken(user.id, user.username);
  res.json({ token });
});

// ── Profile ───────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: ME_SELECT,
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Expose hasGithub instead of raw githubId
  const { githubId, ...rest } = user;
  res.json({ ...rest, hasGithub: !!githubId });
});

// ── Account management ────────────────────────────────────────────────────────

router.delete('/account', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;
  await prisma.user.delete({ where: { id: payload.userId } });
  res.json({ ok: true });
});

router.get('/check-username', requireAuth, async (req: Request, res: Response) => {
  const { username } = req.query as { username: string };
  const payload = req.user as JwtPayload;

  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    res.json({ available: false });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  res.json({ available: !existing || existing.id === payload.userId });
});

// Complete setup wizard
router.patch('/setup', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;
  const { preferredLang, skillLevel, username } = req.body as {
    preferredLang: string;
    skillLevel: string;
    username: string;
  };

  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    res.status(400).json({ error: 'Invalid username format' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== payload.userId) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: { preferredLang, skillLevel, username, setupCompleted: true },
    select: { id: true, username: true, setupCompleted: true, preferredLang: true, skillLevel: true },
  });

  res.json(user);
});

export default router;
