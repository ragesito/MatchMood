import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface MatchHistory {
  matchId: string;
  result: 'WIN' | 'LOSS' | 'DRAW' | null;
  ratingChange: number;
  testsPassed: number;
  testsTotal: number;
  finishedAt: string | null;
  challenge: { title: string; level: string; language: string };
  opponent: { username: string; avatarUrl: string | null } | null;
}

interface DetailedStats {
  winRate: number;
  avgTimeSeconds: number | null;
  totalMatches: number;
  winRateByLanguage: { language: string; winRate: number; played: number }[];
}

interface ProfileData {
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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass, TitleCasePipe],
  template: `
    <div class="page page-enter">

      @if (loading()) {
        <div class="skeleton-page">
          <div class="skeleton" style="height:160px;border-radius:12px;"></div>
          <div class="skeleton-row">
            <div class="skeleton" style="height:100px;flex:1;border-radius:12px;"></div>
            <div class="skeleton" style="height:100px;flex:1;border-radius:12px;"></div>
            <div class="skeleton" style="height:100px;flex:1;border-radius:12px;"></div>
            <div class="skeleton" style="height:100px;flex:1;border-radius:12px;"></div>
          </div>
          <div class="skeleton" style="height:200px;border-radius:12px;"></div>
        </div>
      } @else {
        @if (profile(); as p) {
        <div class="content">

          <!-- ── Hero ── -->
          <div class="hero-card" [class.tier-premium]="p.tier === 'PREMIUM'" [class.tier-enterprise]="p.tier === 'ENTERPRISE'">
            <div class="hero-glow"></div>
            <div class="hero-body">
              <div class="avatar-wrap" [class.ring-animated]="p.tier === 'PREMIUM' || p.tier === 'ENTERPRISE'">
                <img [src]="p.avatarUrl || 'https://github.com/ghost.png'" class="avatar" alt="avatar" />
              </div>
              <div class="hero-info">
                <div class="username-row">
                  <h1>{{ p.username }}</h1>
                  <span class="tier-badge tier-{{ p.tier.toLowerCase() }}">{{ tierLabel(p.tier) }}</span>
                </div>
                <div class="elo-row">
                  <span class="elo-icon">⚡</span>
                  <span class="elo-val">{{ p.rating }}</span>
                  <span class="elo-label">ELO</span>
                </div>
                <div class="joined">Member since {{ p.createdAt | date:'MMMM yyyy' }}</div>
              </div>
              <div class="rank-badge">
                <span class="rank-text">{{ rankLabel(p.rating) }}</span>
              </div>
            </div>
          </div>

          <!-- ── Stats row ── -->
          <div class="stats-row">
            <div class="stat-box">
              <span class="stat-label">Wins</span>
              <span class="stat-num green">{{ p.wins }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Losses</span>
              <span class="stat-num red">{{ p.losses }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Draws</span>
              <span class="stat-num muted">{{ p.draws }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Played</span>
              <span class="stat-num white">{{ totalMatches() }}</span>
            </div>
          </div>

          <!-- ── Detailed stats (Premium/Enterprise) ── -->
          @if (p.detailedStats; as ds) {
            <div class="section">
              <div class="section-header">
                <span class="section-title">Detailed Stats</span>
                <span class="tier-tag">{{ p.tier === 'ENTERPRISE' ? 'Enterprise' : 'Premium' }}</span>
              </div>
              <div class="detail-grid">
                <div class="detail-box">
                  <div class="detail-num green">{{ ds.winRate }}%</div>
                  <div class="detail-label">Win Rate</div>
                  <div class="detail-bar-bg">
                    <div class="detail-bar-fill" [style.width.%]="ds.winRate"></div>
                  </div>
                </div>
                <div class="detail-box">
                  <div class="detail-num amber">{{ formatTime(ds.avgTimeSeconds) }}</div>
                  <div class="detail-label">Avg Solve Time</div>
                </div>
                <div class="detail-box">
                  <div class="detail-num white">{{ ds.totalMatches }}</div>
                  <div class="detail-label">Total Matches</div>
                </div>
              </div>

              @if (ds.winRateByLanguage.length > 0) {
                <div class="lang-section">
                  <div class="lang-title">Win Rate by Language</div>
                  <div class="lang-list">
                    @for (lang of ds.winRateByLanguage; track lang.language) {
                      <div class="lang-row">
                        <span class="lang-name">{{ lang.language | titlecase }}</span>
                        <div class="lang-bar-bg">
                          <div class="lang-bar-fill" [style.width.%]="lang.winRate"></div>
                        </div>
                        <span class="lang-pct">{{ lang.winRate }}%</span>
                        <span class="lang-cnt">{{ lang.played }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- ── Upgrade banners (subtle) ── -->
          @if (p.tier === 'FREE') {
            <div class="upgrade-strip">
              <span class="upgrade-text">★ Unlock detailed stats, full history — <strong>Premium</strong></span>
              <a routerLink="/subscription" class="upgrade-link">Upgrade →</a>
            </div>
          }
          @if (p.tier === 'PREMIUM') {
            <div class="upgrade-strip upgrade-ent">
              <span class="upgrade-text">◆ Private rooms, recruiter tools — <strong>Enterprise</strong></span>
              <a routerLink="/subscription" class="upgrade-link">Upgrade →</a>
            </div>
          }

          <!-- ── Match History ── -->
          <div class="section">
            <div class="section-header">
              <span class="section-title">Match History</span>
              @if (p.tier === 'FREE') {
                <span class="limit-tag">Last 10 · <a routerLink="/subscription" class="limit-link">Upgrade for full history</a></span>
              }
            </div>

            @if (p.history.length === 0) {
              <div class="empty-state">
                <span class="empty-icon">⚔</span>
                <span class="empty-text">No matches yet</span>
                <a routerLink="/arena" class="empty-cta">Jump into the arena →</a>
              </div>
            } @else {
              <div class="history-list">
                @for (match of p.history; track match.matchId) {
                  <div class="history-row" [class.row-win]="match.result === 'WIN'" [class.row-loss]="match.result === 'LOSS'" [class.row-draw]="match.result === 'DRAW'">
                    <div class="result-pill" [class.pill-win]="match.result === 'WIN'" [class.pill-loss]="match.result === 'LOSS'" [class.pill-draw]="match.result === 'DRAW'">
                      {{ match.result ?? '—' }}
                    </div>
                    <div class="match-info">
                      <div class="challenge-title">{{ match.challenge.title }}</div>
                      <div class="match-meta">
                        <span class="lvl-tag lvl-{{ match.challenge.level.toLowerCase() }}">{{ match.challenge.level }}</span>
                        <span class="dot">·</span>
                        <span class="lang-pill">{{ match.challenge.language }}</span>
                        @if (match.opponent) {
                          <span class="dot">·</span>
                          <span class="vs-text">vs <strong>{{ match.opponent.username }}</strong></span>
                        }
                      </div>
                    </div>
                    <div class="match-right">
                      <span class="elo-delta" [class.pos]="match.ratingChange > 0" [class.neg]="match.ratingChange < 0">
                        {{ match.ratingChange > 0 ? '+' : '' }}{{ match.ratingChange }}
                      </span>
                      <span class="match-date">{{ match.finishedAt | date:'MMM d' }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

        </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { flex: 1; overflow-y: auto; padding: 28px 32px; }

    /* Skeleton loader */
    .skeleton-page { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .skeleton-row { display: flex; gap: 12px; }

    .content { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

    /* ── Hero ─────────────────────────────────────────────────────────── */
    .hero-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px;
      position: relative;
      overflow: hidden;
      transition: border-color 250ms ease;
    }
    .hero-card.tier-premium   { border-color: rgba(34,197,94,0.25); background: linear-gradient(135deg, var(--bg-surface) 60%, rgba(34,197,94,0.04)); }
    .hero-card.tier-enterprise { border-color: rgba(139,92,246,0.2); background: linear-gradient(135deg, var(--bg-surface) 60%, rgba(139,92,246,0.03)); }
    .hero-glow { position: absolute; top: -60px; left: -60px; width: 280px; height: 280px; background: radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%); pointer-events: none; }
    .hero-body { display: flex; align-items: center; gap: 24px; position: relative; z-index: 1; }

    .avatar-wrap { position: relative; flex-shrink: 0; width: 80px; height: 80px; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; display: block; border: 2px solid var(--border-bright); }
    .avatar-wrap.ring-animated::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background: conic-gradient(var(--green), transparent, var(--green));
      animation: ringRotate 3s linear infinite;
      z-index: -1;
    }
    @keyframes ringRotate { to { transform: rotate(360deg); } }

    .hero-info { flex: 1; }
    .username-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .tier-badge { padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .tier-badge.free       { background: var(--bg-elevated); color: var(--text-muted); }
    .tier-badge.premium    { background: var(--green-glow); color: var(--green); border: 1px solid rgba(34,197,94,0.25); }
    .tier-badge.enterprise { background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.25); }
    .elo-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
    .elo-icon { color: var(--green); font-size: 16px; }
    .elo-val  { font-size: 20px; font-weight: 900; color: var(--green); letter-spacing: -1px; }
    .elo-label { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
    .joined { font-size: 13px; color: var(--text-muted); }

    .rank-badge {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 16px;
      flex-shrink: 0;
    }
    .rank-text { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }

    /* ── Stats row ──────────────────────────────────────────────────── */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat-box {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 150ms ease, transform 150ms ease;
    }
    .stat-box:hover { border-color: var(--border-bright); transform: translateY(-2px); }
    .stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
    .stat-num   { font-size: 36px; font-weight: 900; letter-spacing: -2px; line-height: 1; }
    .green { color: var(--green); }
    .red   { color: var(--red); }
    .muted { color: var(--text-secondary); }
    .white { color: var(--text-primary); }
    .amber { color: var(--amber); }

    /* ── Section ────────────────────────────────────────────────────── */
    .section { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px; }
    .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
    .section-title  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
    .tier-tag { padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; background: var(--green-glow); color: var(--green); border: 1px solid rgba(34,197,94,0.2); }

    /* ── Detailed stats ─────────────────────────────────────────────── */
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px; }
    .detail-box  { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
    .detail-num  { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
    .detail-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 10px; }
    .detail-bar-bg  { height: 6px; background: var(--bg-base); border-radius: 3px; overflow: hidden; }
    .detail-bar-fill { height: 100%; background: linear-gradient(90deg, var(--green), var(--green-dim)); border-radius: 3px; transition: width 800ms ease; }

    /* ── Language bars ───────────────────────────────────────────────── */
    .lang-section { border-top: 1px solid var(--border); padding-top: 16px; }
    .lang-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 12px; }
    .lang-list  { display: flex; flex-direction: column; gap: 10px; }
    .lang-row   { display: flex; align-items: center; gap: 10px; }
    .lang-name  { width: 90px; font-size: 13px; color: var(--text-secondary); flex-shrink: 0; }
    .lang-bar-bg { flex: 1; height: 6px; background: var(--bg-elevated); border-radius: 3px; overflow: hidden; }
    .lang-bar-fill { height: 100%; background: linear-gradient(90deg, var(--green), var(--green-dim)); border-radius: 3px; }
    .lang-pct { font-size: 12px; color: var(--green); font-weight: 700; width: 36px; text-align: right; flex-shrink: 0; }
    .lang-cnt { font-size: 11px; color: var(--text-muted); width: 60px; text-align: right; flex-shrink: 0; }

    /* ── Upgrade strip ───────────────────────────────────────────────── */
    .upgrade-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border: 1px solid rgba(34,197,94,0.15);
      border-radius: 8px;
      background: rgba(34,197,94,0.02);
    }
    .upgrade-ent { border-color: rgba(139,92,246,0.15); background: rgba(139,92,246,0.02); }
    .upgrade-text { font-size: 13px; color: var(--text-muted); }
    .upgrade-text strong { color: var(--text-secondary); }
    .upgrade-link { font-size: 13px; color: var(--green); font-weight: 600; text-decoration: none; white-space: nowrap; }
    .upgrade-link:hover { text-decoration: underline; }

    /* ── Match history ───────────────────────────────────────────────── */
    .limit-tag  { font-size: 12px; color: var(--text-muted); margin-left: auto; }
    .limit-link { color: var(--green); text-decoration: none; }
    .limit-link:hover { text-decoration: underline; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px; }
    .empty-icon  { font-size: 32px; opacity: 0.2; }
    .empty-text  { font-size: 14px; color: var(--text-muted); }
    .empty-cta   { font-size: 13px; color: var(--green); text-decoration: none; }

    .history-list { display: flex; flex-direction: column; gap: 4px; }
    .history-row {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 12px 14px;
      border-left: 3px solid var(--border);
      transition: background 150ms ease, border-left-color 150ms ease;
    }
    .history-row:hover { background: var(--bg-hover); border-left-color: var(--border-bright); }
    .history-row.row-win  { border-left-color: rgba(34,197,94,0.5); }
    .history-row.row-win:hover  { border-left-color: var(--green); }
    .history-row.row-loss { border-left-color: rgba(239,68,68,0.5); }
    .history-row.row-loss:hover { border-left-color: var(--red); }
    .history-row.row-draw { border-left-color: var(--border-bright); }

    .result-pill { width: 44px; text-align: center; font-size: 10px; font-weight: 800; padding: 4px 0; border-radius: 6px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .pill-win  { background: var(--green-glow); color: var(--green); }
    .pill-loss { background: rgba(239,68,68,0.12); color: var(--red); }
    .pill-draw { background: var(--bg-elevated); color: var(--text-muted); }

    .match-info { flex: 1; min-width: 0; }
    .challenge-title { font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .match-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; flex-wrap: wrap; }
    .dot { color: var(--border-bright); }
    .lvl-tag { font-weight: 700; text-transform: uppercase; font-size: 10px; }
    .lvl-easy   { color: var(--green); }
    .lvl-medium { color: var(--amber); }
    .lvl-hard   { color: var(--red); }
    .lang-pill { color: var(--text-muted); font-size: 11px; }
    .vs-text { color: var(--text-muted); }
    .vs-text strong { color: var(--text-secondary); }

    .match-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .elo-delta  { font-size: 14px; font-weight: 800; color: var(--text-muted); }
    .elo-delta.pos { color: var(--green); }
    .elo-delta.neg { color: var(--red); }
    .match-date { font-size: 11px; color: var(--text-muted); }

    /* Responsive */
    @media (max-width: 768px) {
      .page { padding: 16px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .detail-grid { grid-template-columns: 1fr; }
      .hero-body { flex-direction: column; text-align: center; }
    }
  `],
})
export class ProfileComponent implements OnInit {
  profile = signal<ProfileData | null>(null);
  loading = signal(true);

  constructor(private http: HttpClient, public authService: AuthService) {}

  ngOnInit(): void {
    this.http.get<ProfileData>(`${environment.apiUrl}/profile/me`).subscribe({
      next: (data) => { this.profile.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  totalMatches(): number {
    const p = this.profile();
    return p ? p.wins + p.losses + p.draws : 0;
  }

  tierLabel(tier: string): string {
    const map: Record<string, string> = { FREE: 'Free', PREMIUM: '★ Premium', ENTERPRISE: '◆ Enterprise' };
    return map[tier] ?? tier;
  }

  rankLabel(rating: number): string {
    if (rating >= 1500) return 'Elite';
    if (rating >= 1250) return 'Expert';
    if (rating >= 1100) return 'Solid';
    if (rating >= 1000) return 'Starter';
    return 'Rookie';
  }

  formatTime(seconds: number | null): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
}
