import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';

const router = Router();

// GET /users/:username/public — public profile, no auth required
router.get('/:username/public', async (req: Request, res: Response) => {
  const username = req.params['username'] as string;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      avatarUrl: true,
      tier: true,
      rating: true,
      wins: true,
      losses: true,
      draws: true,
      currentStreak: true,
      longestStreak: true,
      createdAt: true,
      matchResults: {
        orderBy: { match: { finishedAt: 'desc' } },
        take: 20,
        select: {
          result: true,
          ratingChange: true,
          submittedAt: true,
          match: {
            select: {
              finishedAt: true,
              startedAt: true,
              challenge: { select: { language: true } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const total = user.wins + user.losses + user.draws;
  const winRate = total > 0 ? Math.round((user.wins / total) * 100) : 0;

  const rankLabel = (elo: number) => {
    if (elo >= 1500) return 'Elite';
    if (elo >= 1250) return 'Expert';
    if (elo >= 1100) return 'Solid';
    if (elo >= 1000) return 'Starter';
    return 'Rookie';
  };

  const limit = user.tier === 'FREE' ? 5 : 20;
  const recentMatches = user.matchResults.slice(0, limit).map((mp: typeof user.matchResults[0]) => ({
    result: mp.result?.toLowerCase() ?? 'draw',
    eloChange: mp.ratingChange,
    language: mp.match.challenge?.language ?? 'javascript',
    duration: mp.match.startedAt && mp.match.finishedAt
      ? mp.match.finishedAt.getTime() - mp.match.startedAt.getTime()
      : 0,
    playedAt: mp.match.finishedAt?.toISOString() ?? mp.submittedAt?.toISOString() ?? '',
  }));

  res.json({
    username: user.username,
    avatarUrl: user.avatarUrl,
    joinedAt: user.createdAt.toISOString(),
    tier: user.tier,
    elo: user.rating,
    rank: rankLabel(user.rating),
    totalMatches: total,
    winRate,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    verified: user.tier !== 'FREE',
    recentMatches,
    historyLimited: user.tier === 'FREE' && user.matchResults.length > 5,
  });
});

export default router;
