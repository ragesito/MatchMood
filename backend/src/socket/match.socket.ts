import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../middleware/auth';
import prisma from '../config/prisma';
import { generateChallenge } from '../services/challenge.service';

const WINS_TO_WIN = 1; // 1 round — winner takes all
const MAX_ROUNDS  = 5; // safety cap — if nobody wins after 5 rounds, end as draw

// ── Queue entry ──────────────────────────────────────────────────────────────
interface QueueEntry {
  socketId:   string;
  language:   string;
  difficulty: string;
}
const queue: Map<string, QueueEntry> = new Map(); // userId → QueueEntry

interface RoundRecord {
  roundNumber:    number;
  challengeTitle: string;
  winnerId:       string | null;
  codes:          Map<string, string>;   // userId → submitted code
  times:          Map<string, number>;   // userId → ms since round start
  startedAt:      number;
}

interface ActiveMatch {
  player1Id:        string;
  player2Id:        string;
  dbMatchId:        string;
  round:            number;
  language:         string;
  difficulty:       string;
  roundWins:        Map<string, number>;
  submissions:      Map<string, { passed: number; total: number }>;
  runnerCode:       string;
  currentChallenge: { title: string; description: string; level: string };
  roundHistory:     RoundRecord[];
  roundStartedAt:   number;
}

const activeMatches: Map<string, ActiveMatch> = new Map();

// roomId → userId → disconnect timer
const disconnectTimers: Map<string, Map<string, ReturnType<typeof setTimeout>>> = new Map();
// private room code → metadata
const privateRooms: Map<string, { creatorId: string; creatorSocketId: string; guestSocketId?: string; roomId?: string }> = new Map();
// spectators: roomId → Set of socketIds
const spectators: Map<string, Set<string>> = new Map();

const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python:     71,
  java:       62,
  cpp:        54,
  go:         60,
  rust:       73,
};

export function registerMatchHandlers(io: Server): void {

  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      socket.data['user'] = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data['user'] as JwtPayload;
    console.log(`Socket connected: ${user.username}`);

    // ── Reconnect: clear forfeit timer ────────────────────────────────────
    socket.on('match:reconnect', ({ roomId }: { roomId: string }) => {
      const timers = disconnectTimers.get(roomId);
      if (timers?.has(user.userId)) {
        clearTimeout(timers.get(user.userId)!);
        timers.delete(user.userId);
        io.to(roomId).emit('match:opponent_reconnected', { username: user.username });
      }
    });

    // ── Matchmaking ────────────────────────────────────────────────────────
    socket.on('match:join_queue', async (data?: { language?: string; difficulty?: string }) => {
      const language   = (data?.language   ?? 'javascript').toLowerCase();
      const difficulty = (data?.difficulty ?? 'easy').toLowerCase();
      const level      = difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';

      // Find opponent waiting with the same language AND difficulty
      const waitingEntry = [...queue.entries()].find(
        ([uid, entry]) =>
          uid !== user.userId &&
          entry.language   === language &&
          entry.difficulty === difficulty
      );

      if (waitingEntry) {
        const [opponentId, opponentQueueEntry] = waitingEntry;
        queue.delete(opponentId);

        const roomId = `match_${Date.now()}`;
        socket.join(roomId);
        io.sockets.sockets.get(opponentQueueEntry.socketId)?.join(roomId);

        // Fetch both players' info for the Match Found screen
        const [meUser, oppUser] = await Promise.all([
          prisma.user.findUnique({ where: { id: user.userId }, select: { username: true, avatarUrl: true, rating: true, tier: true } }),
          prisma.user.findUnique({ where: { id: opponentId  }, select: { username: true, avatarUrl: true, rating: true, tier: true } }),
        ]);

        // Emit match:found to each player (me/opponent swapped per perspective)
        socket.emit('match:found', {
          me:       { username: meUser!.username,  avatarUrl: meUser!.avatarUrl,  rating: meUser!.rating,  tier: meUser!.tier  },
          opponent: { username: oppUser!.username, avatarUrl: oppUser!.avatarUrl, rating: oppUser!.rating, tier: oppUser!.tier },
          language,
          difficulty,
        });
        io.sockets.sockets.get(opponentQueueEntry.socketId)?.emit('match:found', {
          me:       { username: oppUser!.username, avatarUrl: oppUser!.avatarUrl, rating: oppUser!.rating, tier: oppUser!.tier },
          opponent: { username: meUser!.username,  avatarUrl: meUser!.avatarUrl,  rating: meUser!.rating,  tier: meUser!.tier  },
          language,
          difficulty,
        });

        // Generate challenge while players see the Match Found screen
        console.log(`Generating ${level} ${language} challenge for round 1...`);
        const challenge = await generateChallenge(level, language);
        console.log(`Challenge generated: ${challenge.title}`);

        const dbMatch = await prisma.match.create({
          data: {
            status:     'IN_PROGRESS',
            challengeId: challenge.id,
            player1Id:  opponentId,
            player2Id:  user.userId,
            language,
            difficulty,
            startedAt:  new Date(),
            players: {
              create: [{ userId: opponentId }, { userId: user.userId }],
            },
          },
        });

        activeMatches.set(roomId, {
          player1Id:        opponentId,
          player2Id:        user.userId,
          dbMatchId:        dbMatch.id,
          round:            1,
          language,
          difficulty,
          roundWins:        new Map([[opponentId, 0], [user.userId, 0]]),
          submissions:      new Map(),
          runnerCode:       challenge.runnerCode,
          currentChallenge: { title: challenge.title, description: challenge.description, level: challenge.level },
          roundHistory:     [],
          roundStartedAt:   Date.now(),
        });

        io.to(roomId).emit('match:started', {
          matchId:  dbMatch.id,
          roomId,
          round:    1,
          winsToWin: WINS_TO_WIN,
          starterCode: challenge.starterCode,
          language:    challenge.language,
          challenge: {
            title:       challenge.title,
            description: challenge.description,
            level:       challenge.level,
          },
        });

        console.log(`Match started: ${roomId} (${language} · ${level})`);
      } else {
        queue.set(user.userId, { socketId: socket.id, language, difficulty });
        socket.emit('match:waiting');
      }
    });

    // ── Real-time code sharing ─────────────────────────────────────────────
    socket.on('match:code_update', ({ roomId, code }: { roomId: string; code: string }) => {
      socket.to(roomId).emit('match:opponent_code', { code });
    });

    // ── Submit solution ────────────────────────────────────────────────────
    socket.on('match:submit', async ({ roomId, code, language }: {
      roomId: string; code: string; language: string;
    }) => {
      const match = activeMatches.get(roomId);
      if (!match) {
        socket.emit('match:error', { message: 'Match not found' });
        return;
      }

      if (match.submissions.has(user.userId)) return;

      console.log(`Submit from ${user.username} in room ${roomId} (round ${match.round})`);
      socket.emit('match:judging');

      try {
        const dbMatch = await prisma.match.findUnique({
          where:   { id: match.dbMatchId },
          include: { challenge: true },
        });
        const testCases = (dbMatch?.challenge.testCases as Array<{ input: string; expectedOutput: string }>) ?? [];
        const languageId = LANGUAGE_IDS[language] ?? LANGUAGE_IDS[match.language] ?? 63;

        const results = await Promise.all(
          testCases.map((tc) => runTestCase(code, languageId, tc.input, tc.expectedOutput, match.runnerCode))
        );

        const passed = results.filter((r) => r.passed).length;
        const total  = testCases.length;

        match.submissions.set(user.userId, { passed, total });

        let currentRecord = match.roundHistory.find(r => r.roundNumber === match.round);
        if (!currentRecord) {
          currentRecord = {
            roundNumber:    match.round,
            challengeTitle: match.currentChallenge.title,
            winnerId:       null,
            codes:          new Map(),
            times:          new Map(),
            startedAt:      match.roundStartedAt,
          };
          match.roundHistory.push(currentRecord);
        }
        currentRecord.codes.set(user.userId, code);
        currentRecord.times.set(user.userId, Date.now() - match.roundStartedAt);

        await prisma.matchPlayer.update({
          where: { matchId_userId: { matchId: match.dbMatchId, userId: user.userId } },
          data:  { finalCode: code, testsPassed: passed, testsTotal: total, submittedAt: new Date() },
        });

        socket.emit('match:submission_result', { passed, total, results });

        if (match.submissions.size === 2) {
          await resolveRound(io, roomId, match);
        } else {
          socket.to(roomId).emit('match:opponent_submitted', { passed, total });
        }
      } catch (err) {
        console.error('Submission error:', err);
        socket.emit('match:error', { message: 'Execution failed' });
      }
    });

    // ── Private room: create ───────────────────────────────────────────────
    socket.on('room:create', async ({ code }: { code: string }) => {
      privateRooms.set(code, { creatorId: user.userId, creatorSocketId: socket.id });
      socket.join(`private_${code}`);
      socket.emit('room:created', { code });
      console.log(`Private room created: ${code} by ${user.username}`);
    });

    // ── Private room: join ─────────────────────────────────────────────────
    socket.on('room:join', async ({ code }: { code: string }) => {
      const room = privateRooms.get(code);
      if (!room) { socket.emit('room:error', { message: 'Room not found or expired' }); return; }
      if (room.guestSocketId) { socket.emit('room:error', { message: 'Room is full' }); return; }
      if (room.creatorId === user.userId) { socket.emit('room:error', { message: 'Cannot join your own room' }); return; }

      room.guestSocketId = socket.id;
      socket.join(`private_${code}`);

      io.to(`private_${code}`).emit('room:player_joined', { username: user.username, count: 2 });

      const roomId = `private_${code}_match`;
      const creatorSocket = io.sockets.sockets.get(room.creatorSocketId);
      creatorSocket?.join(roomId);
      socket.join(roomId);
      room.roomId = roomId;

      io.to(roomId).emit('match:generating');

      try {
        const challenge = await generateChallenge('EASY', 'javascript');
        const dbMatch = await prisma.match.create({
          data: {
            status: 'IN_PROGRESS', challengeId: challenge.id,
            player1Id: room.creatorId, player2Id: user.userId,
            language: 'javascript', difficulty: 'easy',
            startedAt: new Date(),
            players: { create: [{ userId: room.creatorId }, { userId: user.userId }] },
          },
        });

        activeMatches.set(roomId, {
          player1Id: room.creatorId, player2Id: user.userId, dbMatchId: dbMatch.id,
          round: 1, language: 'javascript', difficulty: 'easy',
          roundWins: new Map([[room.creatorId, 0], [user.userId, 0]]),
          submissions: new Map(), runnerCode: challenge.runnerCode,
          currentChallenge: { title: challenge.title, description: challenge.description, level: challenge.level },
          roundHistory: [], roundStartedAt: Date.now(),
        });

        io.to(roomId).emit('match:started', {
          matchId: dbMatch.id, roomId, round: 1, winsToWin: WINS_TO_WIN,
          starterCode: challenge.starterCode, language: challenge.language,
          challenge: { title: challenge.title, description: challenge.description, level: challenge.level },
        });
      } catch (err) {
        io.to(roomId).emit('match:error', { message: 'Failed to generate challenge' });
      }
    });

    // ── Spectator: join ────────────────────────────────────────────────────
    socket.on('spectate:join', ({ roomCode }: { roomCode: string }) => {
      const room = privateRooms.get(roomCode);
      if (!room?.roomId || room.creatorId !== user.userId) {
        socket.emit('room:error', { message: 'Not authorized to spectate' }); return;
      }
      socket.join(room.roomId);
      if (!spectators.has(room.roomId)) spectators.set(room.roomId, new Set());
      spectators.get(room.roomId)!.add(socket.id);
      socket.emit('spectate:joined', { roomId: room.roomId });
    });

    // ── Leave queue (cancel matchmaking without disconnecting) ────────────
    socket.on('match:leave_queue', () => {
      queue.delete(user.userId);
      console.log(`${user.username} left the queue`);
    });

    // ── Disconnect with forfeit ────────────────────────────────────────────
    socket.on('disconnect', () => {
      queue.delete(user.userId);
      console.log(`Socket disconnected: ${user.username}`);

      for (const [roomId, match] of activeMatches.entries()) {
        const isPlayer = match.player1Id === user.userId || match.player2Id === user.userId;
        if (!isPlayer) continue;

        if (!disconnectTimers.has(roomId)) disconnectTimers.set(roomId, new Map());
        const timers = disconnectTimers.get(roomId)!;

        io.to(roomId).emit('match:opponent_disconnected', { username: user.username, reconnectWindow: 30 });

        const timer = setTimeout(async () => {
          const stillActive = activeMatches.get(roomId);
          if (!stillActive) return;
          const winnerId = stillActive.player1Id === user.userId ? stillActive.player2Id : stillActive.player1Id;
          const p1Wins = winnerId === stillActive.player1Id ? WINS_TO_WIN : 0;
          const p2Wins = winnerId === stillActive.player2Id ? WINS_TO_WIN : 0;
          io.to(roomId).emit('match:opponent_forfeited', { username: user.username });
          await finishMatch(io, roomId, stillActive, p1Wins, p2Wins);
        }, 30_000);

        timers.set(user.userId, timer);
      }
    });
  });
}

// ── Resolve a single round ─────────────────────────────────────────────────
async function resolveRound(io: Server, roomId: string, match: ActiveMatch): Promise<void> {
  const p1 = match.submissions.get(match.player1Id)!;
  const p2 = match.submissions.get(match.player2Id)!;

  let roundWinnerId: string | null = null;
  if (p1.passed > p2.passed) roundWinnerId = match.player1Id;
  else if (p2.passed > p1.passed) roundWinnerId = match.player2Id;

  if (roundWinnerId) {
    match.roundWins.set(roundWinnerId, (match.roundWins.get(roundWinnerId) ?? 0) + 1);
  }

  const p1Wins = match.roundWins.get(match.player1Id) ?? 0;
  const p2Wins = match.roundWins.get(match.player2Id) ?? 0;

  const roundRecord = match.roundHistory.find(r => r.roundNumber === match.round);
  if (roundRecord) roundRecord.winnerId = roundWinnerId;

  io.to(roomId).emit('match:round_finished', {
    round: match.round,
    roundWinnerId,
    draw:   !roundWinnerId,
    scores: { [match.player1Id]: p1Wins, [match.player2Id]: p2Wins },
  });

  const matchOver = p1Wins >= WINS_TO_WIN || p2Wins >= WINS_TO_WIN || match.round >= MAX_ROUNDS;

  if (matchOver) {
    await finishMatch(io, roomId, match, p1Wins, p2Wins);
  } else {
    match.round     += 1;
    match.submissions = new Map();

    const level = match.difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
    setTimeout(async () => {
      io.to(roomId).emit('match:generating');
      const challenge = await generateChallenge(level, match.language);
      match.runnerCode = challenge.runnerCode;
      match.currentChallenge = { title: challenge.title, description: challenge.description, level: challenge.level };

      io.to(roomId).emit('match:next_round', {
        round:     match.round,
        winsToWin: WINS_TO_WIN,
        starterCode: challenge.starterCode,
        language:    challenge.language,
        challenge: {
          title:       challenge.title,
          description: challenge.description,
          level:       challenge.level,
        },
      });
    }, 4000);
  }
}

// ── Finish the full match and update ratings ───────────────────────────────
async function finishMatch(
  io: Server,
  roomId: string,
  match: ActiveMatch,
  p1Wins: number,
  p2Wins: number
): Promise<void> {
  let winnerId: string | null = null;
  if (p1Wins > p2Wins) winnerId = match.player1Id;
  else if (p2Wins > p1Wins) winnerId = match.player2Id;

  const ratingChange = 25;

  await prisma.match.update({
    where: { id: match.dbMatchId },
    data:  { status: 'FINISHED', winnerId, finishedAt: new Date() },
  });

  const today = new Date().toDateString();
  const calcStreak = (u: { lastPlayedDate: Date | null; currentStreak: number; longestStreak: number }) => {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const lastPlayed = u.lastPlayedDate?.toDateString();
    let streak = u.currentStreak;
    if (lastPlayed === today) { /* already played today */ }
    else if (lastPlayed === yesterday.toDateString()) { streak += 1; }
    else { streak = 1; }
    return { currentStreak: streak, longestStreak: Math.max(streak, u.longestStreak), lastPlayedDate: new Date() };
  };

  // Increment languagesPlayed[language] for both players
  const lang = match.language;
  const incrementLangPlayed = async (userId: string) => {
    await prisma.$executeRaw`
      UPDATE users
      SET "languagesPlayed" = "languagesPlayed" ||
        jsonb_build_object(
          ${lang}::text,
          (COALESCE(("languagesPlayed" ->> ${lang}::text)::int, 0) + 1)
        )
      WHERE id = ${userId}
    `;
  };

  if (winnerId) {
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    const [winner, loser] = await Promise.all([
      prisma.user.findUnique({ where: { id: winnerId }, select: { lastPlayedDate: true, currentStreak: true, longestStreak: true } }),
      prisma.user.findUnique({ where: { id: loserId  }, select: { lastPlayedDate: true, currentStreak: true, longestStreak: true } }),
    ]);

    await Promise.all([
      prisma.user.update({ where: { id: winnerId }, data: { wins:   { increment: 1 }, rating: { increment: ratingChange }, ...calcStreak(winner!) } }),
      prisma.user.update({ where: { id: loserId  }, data: { losses: { increment: 1 }, rating: { decrement: ratingChange }, ...calcStreak(loser!)  } }),
      prisma.matchPlayer.update({ where: { matchId_userId: { matchId: match.dbMatchId, userId: winnerId } }, data: { result: 'WIN',  ratingChange } }),
      prisma.matchPlayer.update({ where: { matchId_userId: { matchId: match.dbMatchId, userId: loserId  } }, data: { result: 'LOSS', ratingChange: -ratingChange } }),
      incrementLangPlayed(match.player1Id),
      incrementLangPlayed(match.player2Id),
    ]);
  } else {
    const [p1, p2] = await Promise.all([
      prisma.user.findUnique({ where: { id: match.player1Id }, select: { lastPlayedDate: true, currentStreak: true, longestStreak: true } }),
      prisma.user.findUnique({ where: { id: match.player2Id }, select: { lastPlayedDate: true, currentStreak: true, longestStreak: true } }),
    ]);

    await Promise.all([
      prisma.user.update({ where: { id: match.player1Id }, data: { draws: { increment: 1 }, ...calcStreak(p1!) } }),
      prisma.user.update({ where: { id: match.player2Id }, data: { draws: { increment: 1 }, ...calcStreak(p2!) } }),
      prisma.matchPlayer.update({ where: { matchId_userId: { matchId: match.dbMatchId, userId: match.player1Id } }, data: { result: 'DRAW', ratingChange: 0 } }),
      prisma.matchPlayer.update({ where: { matchId_userId: { matchId: match.dbMatchId, userId: match.player2Id } }, data: { result: 'DRAW', ratingChange: 0 } }),
      incrementLangPlayed(match.player1Id),
      incrementLangPlayed(match.player2Id),
    ]);
  }

  const rounds = match.roundHistory.map(r => ({
    roundNumber:    r.roundNumber,
    challengeTitle: r.challengeTitle,
    winnerId:       r.winnerId,
    p1Code: r.codes.get(match.player1Id) ?? '',
    p2Code: r.codes.get(match.player2Id) ?? '',
    p1Time: r.times.get(match.player1Id) ?? 0,
    p2Time: r.times.get(match.player2Id) ?? 0,
  }));

  io.to(roomId).emit('match:finished', {
    winnerId,
    draw:      !winnerId,
    eloChange: ratingChange,
    rounds,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    matchId:   match.dbMatchId,
  });

  activeMatches.delete(roomId);
  const timers = disconnectTimers.get(roomId);
  if (timers) { timers.forEach(t => clearTimeout(t)); disconnectTimers.delete(roomId); }
  spectators.delete(roomId);
}

// ── Execute a single test case via Judge0 ─────────────────────────────────
async function runTestCase(
  code: string,
  languageId: number,
  input: string,
  expectedOutput: string,
  runnerCode: string
): Promise<{ passed: boolean; output: string }> {
  // For Go/Rust/Java: runnerCode is a full-file template with a // SOLVE_HERE marker
  const fullCode = runnerCode.includes('// SOLVE_HERE')
    ? runnerCode.replace('// SOLVE_HERE', code)
    : `${code}\n\n${runnerCode}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch('https://judge0-ce.p.rapidapi.com/submissions?wait=true', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'X-RapidAPI-Key':  process.env.JUDGE0_API_KEY!,
        'X-RapidAPI-Host': process.env.JUDGE0_API_HOST!,
      },
      body: JSON.stringify({ source_code: fullCode, language_id: languageId, stdin: input }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const result = await res.json() as any;
    console.log('Judge0 result:', JSON.stringify(result));

    const output = (result.stdout ?? '').trim();
    const passed = output === expectedOutput.trim() && result.status?.id === 3;
    return { passed, output };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('Judge0 error:', err.message);
    return { passed: false, output: '' };
  }
}
