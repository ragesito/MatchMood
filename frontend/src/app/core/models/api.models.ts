// Shared DTOs for the backend HTTP API. One source of truth so components and
// the ApiService agree on response shapes instead of each redeclaring them.

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  date: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl: string | null;
  elo: number;
  winRate: number;
  totalMatches: number;
  currentStreak: number;
  tier: string;
  id: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

export interface MatchHistory {
  matchId: string;
  result: 'WIN' | 'LOSS' | 'DRAW' | null;
  ratingChange: number;
  testsPassed: number;
  testsTotal: number;
  finishedAt: string | null;
  challenge: { title: string; level: string; language: string };
  opponent: { username: string; avatarUrl: string | null } | null;
}

export interface DetailedStats {
  winRate: number;
  avgTimeSeconds: number | null;
  totalMatches: number;
  winRateByLanguage: { language: string; winRate: number; played: number }[];
}

export interface ProfileData {
  username: string;
  avatarUrl: string | null;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
  history: MatchHistory[];
  detailedStats: DetailedStats | null;
}

export interface PublicProfile {
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  elo: number;
  rank: string;
  totalMatches: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  verified: boolean;
  historyLimited: boolean;
  recentMatches: {
    result: string;
    eloChange: number;
    language: string;
    duration: number;
    playedAt: string;
  }[];
}

export interface RoomCreateResponse {
  code: string;
  expiresAt: string;
}

export interface UsernameAvailability {
  available: boolean;
}
