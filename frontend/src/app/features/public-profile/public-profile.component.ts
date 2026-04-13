import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Title, Meta } from '@angular/platform-browser';

interface PublicProfile {
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

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="pub-page page-enter">

      @if (loading()) {
        <div class="full-center">
          <div class="spin"></div>
        </div>
      } @else if (error()) {
        <div class="full-center">
          <div class="err-code">404</div>
          <div class="err-msg">User not found</div>
          <a routerLink="/" class="err-back">← Back to home</a>
        </div>
      }

      @if (profile(); as p) {
        <!-- ── Hero ── -->
        <div class="hero">
          <div class="hero-inner">

            <!-- Avatar -->
            <div class="avatar-wrap" [class.ring-premium]="p.tier === 'PREMIUM'" [class.ring-enterprise]="p.tier === 'ENTERPRISE'">
              <img [src]="p.avatarUrl || 'https://github.com/ghost.png'" class="hero-avatar" [alt]="p.username" />
            </div>

            <!-- Info -->
            <div class="hero-info">
              <div class="name-row">
                <h1 class="hero-username"><span class="at">&#64;</span>{{ p.username }}</h1>
                @if (p.tier !== 'FREE') {
                  <span class="tier-badge tier-{{ p.tier.toLowerCase() }}">
                    {{ p.tier === 'PREMIUM' ? '★ Premium' : '◆ Enterprise' }}
                  </span>
                }
              </div>
              <div class="meta-row">
                <span class="rank-pill">{{ p.rank }}</span>
                <span class="elo-val">{{ p.elo }} ELO</span>
                <span class="joined">Member since {{ p.joinedAt | date:'MMMM yyyy' }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="hero-actions">
              @if (authService.isLoggedIn()) {
                <a routerLink="/arena" class="btn-challenge">Challenge to a match</a>
              } @else {
                <a [href]="loginUrl" class="btn-challenge">Challenge to a match</a>
              }
              <button class="btn-share" (click)="shareProfile()">{{ shareLabel() }}</button>
            </div>

          </div>
        </div>

        <!-- ── Stats ── -->
        <div class="section">
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-num">{{ p.totalMatches }}</div>
              <div class="stat-lbl">Matches</div>
            </div>
            <div class="stat-box">
              <div class="stat-num" [class.green]="p.winRate >= 50" [class.amber]="p.winRate >= 40 && p.winRate < 50" [class.red]="p.winRate < 40">{{ p.winRate }}%</div>
              <div class="stat-lbl">Win Rate</div>
            </div>
            <div class="stat-box">
              <div class="stat-num" [class.green]="p.currentStreak >= 3">{{ p.currentStreak > 0 ? '🔥 ' : '' }}{{ p.currentStreak }}</div>
              <div class="stat-lbl">Streak</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">{{ p.longestStreak }}</div>
              <div class="stat-lbl">Best Streak</div>
            </div>
          </div>
        </div>

        <!-- ── Recent matches ── -->
        @if (p.recentMatches.length > 0) {
          <div class="section">
            <div class="section-title">Recent Matches</div>
            <div class="matches-list">
              @for (m of p.recentMatches; track $index) {
                <div class="match-row">
                  <span class="result-pill result-{{ m.result }}">
                    {{ m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D' }}
                  </span>
                  <span class="match-lang">{{ m.language }}</span>
                  <span class="match-elo" [class.pos]="m.eloChange > 0" [class.neg]="m.eloChange < 0">
                    {{ m.eloChange > 0 ? '+' : '' }}{{ m.eloChange }}
                  </span>
                  <span class="match-date">{{ relativeDate(m.playedAt) }}</span>
                </div>
              }
            </div>
            @if (p.historyLimited) {
              <div class="history-note">
                Full history available on Premium ·
                <a routerLink="/subscription" class="note-link">Upgrade →</a>
              </div>
            }
          </div>
        }

        <!-- ── CTA for non-logged-in ── -->
        @if (!authService.isLoggedIn()) {
          <div class="cta-strip">
            <div class="cta-inner">
              <div class="cta-copy">
                <strong>Create your MatchMood profile</strong>
                <span>Show employers how you code under pressure.</span>
              </div>
              <a [href]="loginUrl" class="cta-btn">Sign up with GitHub</a>
            </div>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    .pub-page { min-height: 100vh; background: var(--bg-base); color: var(--text-primary); display: flex; flex-direction: column; font-family: 'Inter', -apple-system, sans-serif; }

    /* Loading / error */
    .full-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 80px 24px; }
    .spin { width: 32px; height: 32px; border: 2px solid var(--border-bright); border-top-color: var(--green); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .err-code { font-size: 80px; font-weight: 900; color: var(--border); line-height: 1; }
    .err-msg  { font-size: 18px; color: var(--text-muted); }
    .err-back { color: var(--green); text-decoration: none; font-size: 14px; }

    /* Hero */
    .hero { background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%); border-bottom: 1px solid var(--border); padding: 48px 24px 40px; }
    .hero-inner { max-width: 800px; margin: 0 auto; display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }

    /* Avatar */
    .avatar-wrap { position: relative; flex-shrink: 0; width: 80px; height: 80px; }
    .hero-avatar { width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--border-bright); display: block; }
    .avatar-wrap.ring-premium::before,
    .avatar-wrap.ring-enterprise::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background: conic-gradient(var(--green), transparent, var(--green));
      animation: ringRotate 3s linear infinite;
      z-index: -1;
    }
    .avatar-wrap.ring-enterprise::before { background: conic-gradient(#a78bfa, transparent, #a78bfa); }
    @keyframes ringRotate { to { transform: rotate(360deg); } }

    /* Info */
    .hero-info { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
    .name-row  { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .hero-username { font-size: 28px; font-weight: 800; letter-spacing: -1px; margin: 0; }
    .at { color: var(--text-muted); font-weight: 400; }

    .tier-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
    .tier-premium    { background: var(--green-glow); color: var(--green); border: 1px solid rgba(34,197,94,0.25); }
    .tier-enterprise { background: rgba(139,92,246,0.12); color: #a78bfa; border: 1px solid rgba(139,92,246,0.25); }

    .meta-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .rank-pill { font-size: 12px; font-weight: 700; background: var(--bg-elevated); border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; color: var(--text-muted); }
    .elo-val   { font-size: 20px; font-weight: 900; color: var(--green); letter-spacing: -0.5px; }
    .joined    { font-size: 13px; color: var(--text-muted); }

    /* Actions */
    .hero-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .btn-challenge {
      background: var(--green);
      color: #000;
      font-weight: 700;
      font-size: 14px;
      padding: 11px 22px;
      border-radius: 8px;
      text-decoration: none;
      text-align: center;
      transition: background 150ms ease;
      white-space: nowrap;
    }
    .btn-challenge:hover { background: var(--green-dim); }
    .btn-share {
      background: transparent;
      border: 1px solid var(--border-bright);
      color: var(--text-secondary);
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: border-color 150ms ease, color 150ms ease;
    }
    .btn-share:hover { border-color: var(--border-bright); color: var(--text-primary); }

    /* Sections */
    .section { max-width: 800px; margin: 0 auto; padding: 32px 24px 0; width: 100%; box-sizing: border-box; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin: 0 0 14px; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat-box {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      transition: border-color 150ms ease, transform 150ms ease;
    }
    .stat-box:hover { border-color: var(--border-bright); transform: translateY(-2px); }
    .stat-num  { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: var(--text-primary); }
    .stat-lbl  { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 6px; }
    .green { color: var(--green); }
    .amber { color: var(--amber); }
    .red   { color: var(--red); }

    /* Match history */
    .matches-list { display: flex; flex-direction: column; gap: 6px; }
    .match-row {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      transition: border-color 150ms ease;
    }
    .match-row:hover { border-color: var(--border-bright); }
    .result-pill { width: 24px; height: 24px; border-radius: 6px; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .result-win  { background: var(--green-glow); color: var(--green); }
    .result-loss { background: rgba(239,68,68,0.12); color: var(--red); }
    .result-draw { background: var(--bg-elevated); color: var(--text-muted); }
    .match-lang  { font-size: 13px; color: var(--text-secondary); flex: 1; }
    .match-elo   { font-size: 13px; font-weight: 700; color: var(--text-muted); }
    .match-elo.pos { color: var(--green); }
    .match-elo.neg { color: var(--red); }
    .match-date  { font-size: 12px; color: var(--text-muted); }
    .history-note { margin-top: 10px; text-align: center; font-size: 13px; color: var(--text-muted); }
    .note-link   { color: var(--green); text-decoration: none; font-weight: 600; }

    /* CTA strip */
    .cta-strip { margin-top: 48px; border-top: 1px solid var(--border); background: var(--bg-surface); padding: 28px 24px; }
    .cta-inner { max-width: 800px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .cta-copy  { display: flex; flex-direction: column; gap: 4px; }
    .cta-copy strong { font-size: 16px; color: var(--text-primary); }
    .cta-copy span   { font-size: 13px; color: var(--text-muted); }
    .cta-btn {
      background: var(--green);
      color: #000;
      font-weight: 700;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      transition: background 150ms ease;
      white-space: nowrap;
    }
    .cta-btn:hover { background: var(--green-dim); }

    @media (max-width: 640px) {
      .hero-inner    { flex-direction: column; align-items: flex-start; }
      .stats-grid    { grid-template-columns: repeat(2, 1fr); }
      .hero-actions  { flex-direction: row; width: 100%; }
      .btn-challenge { flex: 1; }
    }
  `],
})
export class PublicProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  authService = inject(AuthService);

  profile = signal<PublicProfile | null>(null);
  loading = signal(true);
  error = signal(false);
  shareLabel = signal('Share profile');

  readonly loginUrl = `${environment.apiUrl}/auth/github`;

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username') ?? '';
    this.http.get<PublicProfile>(`${environment.apiUrl}/users/${username}/public`).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
        this.titleService.setTitle(`@${p.username} — MatchMood Profile`);
        this.metaService.updateTag({ property: 'og:title', content: `@${p.username} is ranked ${p.rank} on MatchMood` });
        this.metaService.updateTag({ property: 'og:description', content: `ELO: ${p.elo} · Win rate: ${p.winRate}% · ${p.totalMatches} matches played` });
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }

  shareProfile(): void {
    const username = this.profile()?.username ?? '';
    navigator.clipboard.writeText(`https://matchmood.app/u/${username}`).then(() => {
      this.shareLabel.set('Copied!');
      setTimeout(() => this.shareLabel.set('Share profile'), 2000);
    });
  }

  relativeDate(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7)  return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }
}
