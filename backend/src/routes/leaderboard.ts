import { Router, Request, Response } from 'express';
import { optionalAuth, JwtPayload } from '../middleware/auth';
import prisma from '../config/prisma';

const router = Router();

const VALID_LANGUAGES = ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'cpp'];

// GET /leaderboard?period=global|weekly&language=all|javascript|...&page=1&limit=25
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const period   = (req.query['period']   as string) ?? 'global';
  const language = (req.query['language'] as string) ?? 'all';
  const page     = Math.max(1, parseInt(req.query['page']  as string) || 1);
  const limit    = Math.min(50, parseInt(req.query['limit'] as string) || 25);
  const skip     = (page - 1) * limit;

  // ── Build where clause ────────────────────────────────────────────────
  const whereClause: Record<string, any> = {};

  if (period === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    whereClause['lastPlayedDate'] = { gte: weekAgo };
  }

  // Language filter: only show users who have played ≥ 1 match in that language
  if (language !== 'all' && VALID_LANGUAGES.includes(language)) {
    whereClause['languagesPlayed'] = {
      path: [language],
      gt:   0,
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where:   whereClause,
      orderBy: period === 'weekly'
        ? [{ wins: 'desc' }, { rating: 'desc' }]
        : { rating: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        rating: true,
        wins: true,
        losses: true,
        draws: true,
        currentStreak: true,
        tier: true,
        languagesPlayed: true,
      },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const entries = users.map((u, i) => {
    const totalMatches = u.wins + u.losses + u.draws;
    const lp = (u.languagesPlayed ?? {}) as Record<string, number>;
    return {
      rank: skip + i + 1,
      username: u.username,
      avatarUrl: u.avatarUrl,
      elo: u.rating,
      winRate: totalMatches > 0 ? Math.round((u.wins / totalMatches) * 100) : 0,
      totalMatches,
      currentStreak: u.currentStreak,
      tier: u.tier,
      id: u.id,
      languagesPlayed: lp,
    };
  });

  // ── User's own rank ───────────────────────────────────────────────────
  const authUser = req.user as JwtPayload | undefined;
  let userRank: number | undefined;
  let userEntry: (typeof entries)[0] | undefined;

  if (authUser) {
    const me = await prisma.user.findUnique({
      where:  { id: authUser.userId },
      select: { id: true, username: true, avatarUrl: true, rating: true, wins: true, losses: true, draws: true, currentStreak: true, tier: true, languagesPlayed: true },
    });

    if (me) {
      const aboveWhere: Record<string, any> = {
        ...(period === 'weekly'
          ? { lastPlayedDate: { gte: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })() }, wins: { gt: me.wins } }
          : { rating: { gt: me.rating } }),
      };
      if (language !== 'all' && VALID_LANGUAGES.includes(language)) {
        aboveWhere['languagesPlayed'] = { path: [language], gt: 0 };
      }

      const aboveCount = await prisma.user.count({ where: aboveWhere });
      userRank = aboveCount + 1;

      const totalMatches = me.wins + me.losses + me.draws;
      const lp = (me.languagesPlayed ?? {}) as Record<string, number>;
      userEntry = {
        rank: userRank,
        username: me.username,
        avatarUrl: me.avatarUrl,
        elo: me.rating,
        winRate: totalMatches > 0 ? Math.round((me.wins / totalMatches) * 100) : 0,
        totalMatches,
        currentStreak: me.currentStreak,
        tier: me.tier,
        id: me.id,
        languagesPlayed: lp,
      };
    }
  }

  res.json({ entries, total, page, limit, userRank, userEntry });
});

export default router;
