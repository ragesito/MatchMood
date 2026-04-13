import { Router, Request, Response } from 'express';
import { requireAuth, JwtPayload } from '../middleware/auth';
import prisma from '../config/prisma';

const router = Router();

// PATCH /settings/account — update username and/or preferred language
router.patch('/account', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;
  const { username, preferredLang } = req.body as { username?: string; preferredLang?: string };

  if (username !== undefined) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      res.status(400).json({ error: 'Invalid username format' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== payload.userId) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      ...(username !== undefined && { username }),
      ...(preferredLang !== undefined && { preferredLang }),
    },
    select: { username: true, preferredLang: true },
  });

  res.json(user);
});

// PATCH /settings/preferences — update theme and notification preferences
router.patch('/preferences', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;
  const { theme, notifMatches, notifSummary, notifMilestone } = req.body as {
    theme?: string;
    notifMatches?: boolean;
    notifSummary?: boolean;
    notifMilestone?: boolean;
  };

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      ...(theme !== undefined && { theme }),
      ...(notifMatches !== undefined && { notifMatches }),
      ...(notifSummary !== undefined && { notifSummary }),
      ...(notifMilestone !== undefined && { notifMilestone }),
    },
    select: { theme: true, notifMatches: true, notifSummary: true, notifMilestone: true },
  });

  res.json(user);
});

export default router;
