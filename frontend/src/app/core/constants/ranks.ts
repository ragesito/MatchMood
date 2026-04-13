export interface Rank {
  label: string;
  min: number;
  max: number | null; // null = no ceiling (Grandmaster)
  color: string;
  bgColor: string;
  description: string;
  icon: string; // SVG path or emoji fallback
}

export const RANKS: Rank[] = [
  {
    label: 'Iron',
    min: 0,
    max: 999,
    color: '#71717a',
    bgColor: 'rgba(113,113,122,0.12)',
    description: 'Just getting started. Learn the basics and climb.',
    icon: '⚙️',
  },
  {
    label: 'Bronze',
    min: 1000,
    max: 1199,
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.12)',
    description: 'Building fundamentals. Consistency is key.',
    icon: '🥉',
  },
  {
    label: 'Silver',
    min: 1200,
    max: 1399,
    color: '#94a3b8',
    bgColor: 'rgba(148,163,184,0.12)',
    description: 'Solid foundations. Starting to read opponents.',
    icon: '🥈',
  },
  {
    label: 'Gold',
    min: 1400,
    max: 1599,
    color: '#fbbf24',
    bgColor: 'rgba(251,191,36,0.12)',
    description: 'Consistent performance. Tactical awareness growing.',
    icon: '🥇',
  },
  {
    label: 'Platinum',
    min: 1600,
    max: 1799,
    color: '#2dd4bf',
    bgColor: 'rgba(45,212,191,0.12)',
    description: 'High-level problem solving. Top 20% of players.',
    icon: '💎',
  },
  {
    label: 'Diamond',
    min: 1800,
    max: 1999,
    color: '#60a5fa',
    bgColor: 'rgba(96,165,250,0.12)',
    description: 'Elite coder. Near-perfect execution under pressure.',
    icon: '🔷',
  },
  {
    label: 'Master',
    min: 2000,
    max: 2199,
    color: '#a78bfa',
    bgColor: 'rgba(167,139,250,0.12)',
    description: 'Among the best. Speed and accuracy at peak level.',
    icon: '👑',
  },
  {
    label: 'Grandmaster',
    min: 2200,
    max: null,
    color: '#f43f5e',
    bgColor: 'rgba(244,63,94,0.12)',
    description: 'Legendary. The top 1% of all competitive coders.',
    icon: '🔥',
  },
];

export function getRank(elo: number): Rank {
  return [...RANKS].reverse().find(r => elo >= r.min) ?? RANKS[0];
}

export function getNextRank(elo: number): Rank | null {
  return RANKS.find(r => r.min > elo) ?? null;
}

export function getRankProgress(elo: number): number {
  const current = getRank(elo);
  const next = getNextRank(elo);
  if (!next) return 100;
  const range = next.min - current.min;
  const progress = elo - current.min;
  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
}
