import { Router, Request, Response } from 'express';
import { requireAuth, JwtPayload } from '../middleware/auth';
import prisma from '../config/prisma';

const router = Router();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /rooms — create a private room (Enterprise only)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { tier: true } });
  if (user?.tier !== 'ENTERPRISE') {
    res.status(403).json({ error: 'Enterprise plan required' });
    return;
  }

  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
  } while (attempts < 10 && await prisma.privateRoom.findUnique({ where: { code } }));

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  const room = await prisma.privateRoom.create({
    data: { code, createdById: payload.userId, expiresAt },
  });

  res.json({ code: room.code, expiresAt: room.expiresAt });
});

// GET /rooms/:code — get room status
router.get('/:code', requireAuth, async (req: Request, res: Response) => {
  const code = req.params['code'] as string;
  const room = await prisma.privateRoom.findUnique({
    where: { code },
    include: { createdBy: { select: { username: true, avatarUrl: true } } },
  });

  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  if (room.expiresAt < new Date()) { res.status(410).json({ error: 'Room expired' }); return; }

  res.json({ code: room.code, status: room.status, createdBy: room.createdBy, expiresAt: room.expiresAt });
});

// GET /rooms/:code/report — post-match report for Enterprise/recruiter
router.get('/:code/report', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;
  const code = req.params['code'] as string;

  const room = await prisma.privateRoom.findUnique({ where: { code } });
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  if (room.createdById !== payload.userId) { res.status(403).json({ error: 'Forbidden' }); return; }

  // Find the match associated with this room (most recent match created by room creator)
  const match = await prisma.match.findFirst({
    where: { player1Id: room.createdById },
    orderBy: { createdAt: 'desc' },
    include: {
      challenge: true,
      player1: { select: { username: true, rating: true } },
      player2: { select: { username: true, rating: true } },
      players: { include: { user: { select: { username: true } } } },
    },
  });

  if (!match) { res.status(404).json({ error: 'No match found for this room' }); return; }

  const duration = match.startedAt && match.finishedAt
    ? match.finishedAt.getTime() - match.startedAt.getTime()
    : 0;

  res.json({
    roomCode: code,
    match: {
      id: match.id,
      status: match.status,
      winnerId: match.winnerId,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt,
      durationMs: duration,
    },
    challenge: {
      title: match.challenge.title,
      description: match.challenge.description,
      level: match.challenge.level,
    },
    players: match.players.map(mp => ({
      username: mp.user.username,
      result: mp.result,
      finalCode: mp.finalCode,
      testsPassed: mp.testsPassed,
      testsTotal: mp.testsTotal,
      ratingChange: mp.ratingChange,
      submittedAt: mp.submittedAt,
    })),
  });
});

export default router;
