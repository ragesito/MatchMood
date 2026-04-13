import { Router, Request, Response } from 'express';
import { requireAuth, JwtPayload } from '../middleware/auth';
import prisma from '../config/prisma';

const router = Router();

// GET /profile/me — full profile + match history
// FREE: last 10 matches | PREMIUM/ENTERPRISE: full history + detailed stats
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      tier: true,
      rating: true,
      wins: true,
      losses: true,
      draws: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const matchLimit = user.tier === 'FREE' ? 10 : undefined;

  const matchResults = await prisma.matchPlayer.findMany({
    where: { userId: payload.userId, match: { status: 'FINISHED' } },
    orderBy: { match: { finishedAt: 'desc' } },
    take: matchLimit,
    include: {
      match: {
        include: {
          challenge: { select: { title: true, level: true, language: true } },
          player1: { select: { username: true, avatarUrl: true } },
          player2: { select: { username: true, avatarUrl: true } },
        },
      },
    },
  });

  // Build match history list
  const history = matchResults.map((mp) => {
    const match = mp.match;
    const opponent =
      match.player1.username === user.username ? match.player2 : match.player1;

    return {
      matchId: match.id,
      result: mp.result,
      ratingChange: mp.ratingChange,
      testsPassed: mp.testsPassed,
      testsTotal: mp.testsTotal,
      submittedAt: mp.submittedAt,
      finishedAt: match.finishedAt,
      challenge: match.challenge,
      opponent,
    };
  });

  // Detailed stats — only for PREMIUM/ENTERPRISE
  let detailedStats = null;
  if (user.tier !== 'FREE' && matchResults.length > 0) {
    const totalMatches = user.wins + user.losses + user.draws;
    const winRate = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;

    // Average solve time (only for submitted matches)
    const submitted = matchResults.filter(
      (mp) => mp.submittedAt && mp.match.startedAt
    );
    const avgTimeSeconds =
      submitted.length > 0
        ? Math.round(
            submitted.reduce((acc, mp) => {
              const diff =
                new Date(mp.submittedAt!).getTime() -
                new Date(mp.match.startedAt!).getTime();
              return acc + diff / 1000;
            }, 0) / submitted.length
          )
        : null;

    // Win rate by language
    const byLanguage: Record<string, { wins: number; total: number }> = {};
    matchResults.forEach((mp) => {
      const lang = mp.match.challenge.language;
      if (!byLanguage[lang]) byLanguage[lang] = { wins: 0, total: 0 };
      byLanguage[lang].total++;
      if (mp.result === 'WIN') byLanguage[lang].wins++;
    });

    const winRateByLanguage = Object.entries(byLanguage).map(([lang, data]) => ({
      language: lang,
      winRate: Math.round((data.wins / data.total) * 100),
      played: data.total,
    }));

    detailedStats = { winRate, avgTimeSeconds, winRateByLanguage, totalMatches };
  }

  res.json({ ...user, history, detailedStats });
});

export default router;
