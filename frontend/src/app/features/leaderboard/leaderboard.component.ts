import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface LeaderboardEntry {
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

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="lb page-enter">
      <div class="lb-inner">

        <!-- ── Header ── -->
        <div class="lb-hdr">
          <div class="lb-hdr-left">
            <h1>Leaderboard</h1>
            <p>Top players ranked by ELO rating</p>
          </div>
          <div class="lb-hdr-right">
            <!-- Period tabs -->
            <div class="period-tabs">
              <button class="ptab" [class.active]="period()==='global'" (click)="setPeriod('global')">Global</button>
              <button class="ptab" [class.active]="period()==='weekly'" (click)="setPeriod('weekly')">This week</button>
            </div>
          </div>
        </div>

        <!-- ── Search + Language filters ── -->
        <div class="toolbar">
          <div class="search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14" class="search-icon"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>
            <input class="search-input" type="text" placeholder="Search player…" [(ngModel)]="searchQuery" />
          </div>
          <div class="lang-filters">
            @for (l of langs; track l.id) {
              <button class="lf" [class.active]="activeLang()===l.id" (click)="setLang(l.id)">
                <span class="lf-dot" [style.background]="l.color"></span>
                {{ l.label }}
              </button>
            }
          </div>
        </div>

        @if (loading()) {
          <!-- Skeleton -->
          <div class="podium-skeleton">
            @for (i of [1,2,3]; track i) {
              <div class="skeleton" style="height:140px;border-radius:14px;"></div>
            }
          </div>
          <div class="table-glass">
            @for (i of [1,2,3,4,5,6,7]; track i) {
              <div class="skeleton" [style.animation-delay]="(i*50)+'ms'" style="height:56px;border-radius:0;margin:0;"></div>
            }
          </div>
        } @else {

          <!-- ── Podium Top 3 ── -->
          @if (top3().length > 0) {
            <div class="podium">
              <!-- #2 left -->
              @if (top3()[1]; as p2) {
                <a [routerLink]="['/u', p2.username]" class="podium-card p2">
                  <div class="pc-rank-badge silver">2</div>
                  <div class="pc-av-wrap">
                    <img [src]="p2.avatarUrl || 'https://github.com/ghost.png'" class="pc-av" />
                  </div>
                  <div class="pc-name">{{ p2.username }}</div>
                  <div class="pc-elo">{{ p2.elo }} <span>ELO</span></div>
                  <div class="pc-wr">{{ p2.winRate }}% WR</div>
                  <div class="podium-base p2-base"></div>
                </a>
              }
              <!-- #1 center -->
              @if (top3()[0]; as p1) {
                <a [routerLink]="['/u', p1.username]" class="podium-card p1">
                  <div class="pc-crown">👑</div>
                  <div class="pc-av-wrap av-gold">
                    <img [src]="p1.avatarUrl || 'https://github.com/ghost.png'" class="pc-av" />
                  </div>
                  <div class="pc-name">{{ p1.username }}</div>
                  <div class="pc-elo">{{ p1.elo }} <span>ELO</span></div>
                  <div class="pc-wr">{{ p1.winRate }}% WR</div>
                  <div class="podium-base p1-base"></div>
                </a>
              }
              <!-- #3 right -->
              @if (top3()[2]; as p3) {
                <a [routerLink]="['/u', p3.username]" class="podium-card p3">
                  <div class="pc-rank-badge bronze">3</div>
                  <div class="pc-av-wrap">
                    <img [src]="p3.avatarUrl || 'https://github.com/ghost.png'" class="pc-av" />
                  </div>
                  <div class="pc-name">{{ p3.username }}</div>
                  <div class="pc-elo">{{ p3.elo }} <span>ELO</span></div>
                  <div class="pc-wr">{{ p3.winRate }}% WR</div>
                  <div class="podium-base p3-base"></div>
                </a>
              }
            </div>
          }

          <!-- ── Table ── -->
          <div class="table-glass">
            <!-- Head -->
            <div class="t-head">
              <span class="c-rank">#</span>
              <span class="c-user">Player</span>
              <span class="c-elo">ELO</span>
              <span class="c-wr">Win rate</span>
              <span class="c-matches">Matches</span>
              <span class="c-streak">Streak</span>
            </div>

            @if (filtered().length === 0) {
              <div class="empty-st">
                <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2" width="36" height="36" style="opacity:.2"><path d="M20 4l4 8 9 1.3-6.5 6.3 1.5 9L20 24l-8 4.6 1.5-9L7 13.3l9-1.3z"/></svg>
                <span>No players found</span>
              </div>
            } @else {
              @for (entry of tableEntries(); track entry.username; let i = $index) {
                <a [routerLink]="['/u', entry.username]"
                   class="t-row"
                   [class.top1]="entry.rank===1"
                   [class.top2]="entry.rank===2"
                   [class.top3]="entry.rank===3"
                   [class.is-me]="entry.username===authService.user()?.username"
                   [style.animation-delay]="(i*25)+'ms'"
                   style="animation: rowIn 220ms ease both;">
                  <span class="c-rank">
                    @if (entry.rank===1) { <span class="rk rk-gold">1</span> }
                    @else if (entry.rank===2) { <span class="rk rk-silver">2</span> }
                    @else if (entry.rank===3) { <span class="rk rk-bronze">3</span> }
                    @else { <span class="rk">{{ entry.rank }}</span> }
                  </span>
                  <span class="c-user">
                    <img [src]="entry.avatarUrl || 'https://github.com/ghost.png'" class="t-av" />
                    <span class="t-name">{{ entry.username }}</span>
                    @if (entry.username === authService.user()?.username) {
                      <span class="you-tag">YOU</span>
                    }
                    @if (entry.tier !== 'FREE') {
                      <span class="tier-dot tier-{{ entry.tier.toLowerCase() }}">{{ entry.tier==='PREMIUM' ? '★' : '◆' }}</span>
                    }
                  </span>
                  <span class="c-elo">{{ entry.elo }}</span>
                  <span class="c-wr">
                    <span class="wr-bar-wrap">
                      <span class="wr-bar" [style.width]="entry.winRate+'%'" [class.wr-high]="entry.winRate>=50" [class.wr-mid]="entry.winRate>=35&&entry.winRate<50"></span>
                    </span>
                    <span class="wr-num" [class.wr-green]="entry.winRate>=50" [class.wr-amber]="entry.winRate>=35&&entry.winRate<50">{{ entry.winRate }}%</span>
                  </span>
                  <span class="c-matches">{{ entry.totalMatches }}</span>
                  <span class="c-streak">{{ entry.currentStreak > 0 ? '🔥 ' + entry.currentStreak : '—' }}</span>
                </a>
              }
            }

            <!-- Pinned: my row if not on page -->
            @if (authService.isLoggedIn() && data()?.userEntry && !isOnPage()) {
              <div class="t-separator"></div>
              <a [routerLink]="['/u', data()!.userEntry!.username]" class="t-row is-me my-pinned">
                <span class="c-rank"><span class="rk">{{ data()!.userRank }}</span></span>
                <span class="c-user">
                  <img [src]="data()!.userEntry!.avatarUrl || 'https://github.com/ghost.png'" class="t-av" />
                  <span class="t-name">{{ data()!.userEntry!.username }}</span>
                  <span class="you-tag">YOU</span>
                </span>
                <span class="c-elo">{{ data()!.userEntry!.elo }}</span>
                <span class="c-wr">
                  <span class="wr-bar-wrap">
                    <span class="wr-bar" [style.width]="data()!.userEntry!.winRate+'%'" [class.wr-high]="data()!.userEntry!.winRate>=50"></span>
                  </span>
                  <span class="wr-num" [class.wr-green]="data()!.userEntry!.winRate>=50">{{ data()!.userEntry!.winRate }}%</span>
                </span>
                <span class="c-matches">{{ data()!.userEntry!.totalMatches }}</span>
                <span class="c-streak">{{ data()!.userEntry!.currentStreak > 0 ? '🔥 ' + data()!.userEntry!.currentStreak : '—' }}</span>
              </a>
            }
          </div>

          <!-- ── Pagination ── -->
          @if ((data()?.total ?? 0) > (data()?.limit ?? 25)) {
            <div class="pagination">
              <button class="pg" [disabled]="page()===1" (click)="setPage(page()-1)">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M8 2L4 6l4 4"/></svg>
                Prev
              </button>
              <span class="pg-info">{{ page() }} / {{ totalPages() }}</span>
              <button class="pg" [disabled]="page()>=totalPages()" (click)="setPage(page()+1)">
                Next
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M4 2l4 4-4 4"/></svg>
              </button>
            </div>
          }

        }
      </div>
    </div>
  `,
  styles: [`
    /* ── Page ── */
    .lb       { flex: 1; overflow-y: auto; }
    .lb-inner { max-width: 900px; margin: 0 auto; padding: 36px 24px 60px; display: flex; flex-direction: column; gap: 20px; }

    /* ── Header ── */
    .lb-hdr       { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
    .lb-hdr-left h1 { font-size: 28px; font-weight: 800; letter-spacing: -.5px; margin: 0 0 4px; }
    .lb-hdr-left p  { font-size: 13px; color: var(--text-muted); margin: 0; }
    .lb-hdr-right { display: flex; align-items: center; gap: 12px; }

    .period-tabs { display: flex; background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 3px; gap: 3px; }
    .ptab { background: transparent; border: none; color: var(--text-muted); padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 150ms ease; }
    .ptab.active { background: rgba(255,255,255,0.08); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.1); }

    /* ── Toolbar ── */
    .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

    .search-wrap {
      position: relative; display: flex; align-items: center; flex: 1; min-width: 180px;
    }
    .search-icon { position: absolute; left: 12px; color: var(--text-muted); pointer-events: none; }
    .search-input {
      width: 100%; padding: 9px 12px 9px 36px;
      background: rgba(255,255,255,0.05); backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      font-size: 13px; color: var(--text-primary); outline: none;
      transition: border-color 150ms ease; font-family: inherit;
    }
    .search-input::placeholder { color: var(--text-muted); }
    .search-input:focus { border-color: rgba(34,197,94,0.4); }

    .lang-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .lf {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 500;
      background: rgba(255,255,255,0.04); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.07); color: var(--text-muted);
      cursor: pointer; transition: all 150ms ease; white-space: nowrap;
    }
    .lf:hover { border-color: rgba(255,255,255,0.15); color: var(--text-secondary); }
    .lf.active { border-color: rgba(34,197,94,0.4); color: var(--green); background: rgba(34,197,94,0.06); }
    .lf-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

    /* ── Podium ── */
    .podium {
      display: flex; align-items: flex-end; justify-content: center;
      gap: 12px; padding: 0 0 4px;
    }
    .podium-card {
      flex: 1; max-width: 240px; display: flex; flex-direction: column; align-items: center;
      text-decoration: none; color: inherit; cursor: pointer;
      position: relative; transition: transform 200ms ease;
    }
    .podium-card:hover { transform: translateY(-4px); }

    .pc-crown { font-size: 22px; margin-bottom: 4px; animation: crownBob 2.5s ease-in-out infinite; }
    @keyframes crownBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

    .pc-rank-badge {
      width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800; margin-bottom: 8px;
    }
    .silver { background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); }
    .bronze { background: rgba(180,83,9,0.15); color: #b45309; border: 1px solid rgba(180,83,9,0.3); }

    .pc-av-wrap {
      width: 64px; height: 64px; border-radius: 50%; overflow: hidden;
      border: 2px solid rgba(255,255,255,0.1); margin-bottom: 10px; flex-shrink: 0;
      position: relative;
    }
    .p1 .pc-av-wrap { width: 80px; height: 80px; }
    .av-gold { border-color: rgba(251,191,36,0.5) !important; box-shadow: 0 0 20px rgba(251,191,36,0.2); }

    .pc-av { width: 100%; height: 100%; object-fit: cover; display: block; }

    .pc-name { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .p1 .pc-name { font-size: 15px; }
    .pc-elo { font-size: 20px; font-weight: 900; letter-spacing: -1px; color: var(--text-primary); }
    .p1 .pc-elo { font-size: 24px; color: #fbbf24; }
    .p2 .pc-elo { color: #94a3b8; }
    .p3 .pc-elo { color: #b45309; }
    .pc-elo span { font-size: 10px; font-weight: 500; color: var(--text-muted); letter-spacing: 0; }
    .pc-wr { font-size: 11px; color: var(--text-muted); margin-top: 2px; margin-bottom: 12px; }

    .podium-base {
      width: 100%; border-radius: 10px 10px 0 0;
      backdrop-filter: blur(16px);
    }
    .p1-base { height: 52px; background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-bottom: none; }
    .p2-base { height: 36px; background: rgba(148,163,184,0.06); border: 1px solid rgba(148,163,184,0.15); border-bottom: none; }
    .p3-base { height: 26px; background: rgba(180,83,9,0.06); border: 1px solid rgba(180,83,9,0.15); border-bottom: none; }

    .podium-skeleton { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

    /* ── Glass table ── */
    .table-glass {
      background: rgba(13,13,13,0.6);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px; overflow: hidden;
    }

    .t-head {
      display: grid;
      grid-template-columns: 52px 1fr 80px 130px 80px 74px;
      padding: 11px 18px;
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em;
      color: var(--text-muted);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .t-row {
      display: grid;
      grid-template-columns: 52px 1fr 80px 130px 80px 74px;
      padding: 13px 18px; align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      text-decoration: none; color: inherit;
      transition: background 150ms ease;
      cursor: pointer;
    }
    .t-row:last-child { border-bottom: none; }
    .t-row:hover { background: rgba(255,255,255,0.04); }

    .t-row.top1 { background: rgba(251,191,36,0.05); }
    .t-row.top2 { background: rgba(148,163,184,0.03); }
    .t-row.top3 { background: rgba(180,83,9,0.03); }
    .t-row.top1:hover { background: rgba(251,191,36,0.09); }

    .t-row.is-me { background: rgba(34,197,94,0.04); border-left: 2px solid var(--green); }
    .t-row.my-pinned { background: rgba(34,197,94,0.06); }

    @keyframes rowIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Rank */
    .c-rank { display: flex; align-items: center; justify-content: center; }
    .rk         { font-size: 13px; font-weight: 700; color: var(--text-muted); }
    .rk-gold    { color: #fbbf24; font-size: 15px; }
    .rk-silver  { color: #94a3b8; font-size: 14px; }
    .rk-bronze  { color: #b45309; font-size: 14px; }

    /* User cell */
    .c-user { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .t-av   { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; object-fit: cover; }
    .t-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .you-tag { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.25); padding: 2px 6px; border-radius: 4px; flex-shrink: 0; }
    .tier-dot { font-size: 10px; flex-shrink: 0; }
    .tier-premium    { color: var(--green); }
    .tier-enterprise { color: #a78bfa; }

    /* ELO */
    .c-elo { font-size: 14px; font-weight: 700; color: var(--text-primary); text-align: right; }

    /* Win rate with bar */
    .c-wr { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
    .wr-bar-wrap { width: 44px; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; flex-shrink: 0; overflow: hidden; }
    .wr-bar      { height: 100%; border-radius: 2px; background: var(--text-muted); transition: width 600ms ease; }
    .wr-bar.wr-high { background: var(--green); }
    .wr-bar.wr-mid  { background: var(--amber); }
    .wr-num { font-size: 13px; min-width: 36px; text-align: right; color: var(--text-muted); }
    .wr-green { color: var(--green); }
    .wr-amber { color: var(--amber); }

    /* Other cols */
    .c-matches, .c-streak { font-size: 13px; color: var(--text-muted); text-align: right; }

    /* Separator */
    .t-separator { border-top: 1px dashed rgba(255,255,255,0.08); margin: 0 18px; }

    /* Empty */
    .empty-st { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 24px; color: var(--text-muted); font-size: 13px; }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; }
    .pg {
      display: flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.05); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.08); color: var(--text-secondary);
      padding: 9px 18px; border-radius: 9px; font-size: 13px; cursor: pointer;
      transition: all 150ms ease;
    }
    .pg:hover:not(:disabled) { border-color: rgba(255,255,255,0.18); color: var(--text-primary); }
    .pg:disabled { opacity: .3; cursor: not-allowed; }
    .pg-info { font-size: 13px; color: var(--text-muted); min-width: 50px; text-align: center; }

    @media (max-width: 640px) {
      .podium { gap: 8px; }
      .t-head, .t-row { grid-template-columns: 40px 1fr 64px 64px; }
      .c-matches, .c-streak { display: none; }
      .lang-filters { display: none; }
    }
  `],
})
export class LeaderboardComponent implements OnInit {
  authService = inject(AuthService);
  private http = inject(HttpClient);

  period   = signal<'global' | 'weekly'>('global');
  page     = signal(1);
  data     = signal<LeaderboardResponse | null>(null);
  loading  = signal(true);
  searchQuery = '';
  activeLang  = signal('all');

  langs = [
    { id: 'all',        label: 'All',        color: '#6b7280' },
    { id: 'javascript', label: 'JS',         color: '#f7df1e' },
    { id: 'typescript', label: 'TS',         color: '#3178c6' },
    { id: 'python',     label: 'Python',     color: '#3776ab' },
    { id: 'go',         label: 'Go',         color: '#00add8' },
    { id: 'rust',       label: 'Rust',       color: '#f74c00' },
    { id: 'java',       label: 'Java',       color: '#f89820' },
    { id: 'cpp',        label: 'C++',        color: '#9c33b5' },
  ];

  top3 = computed(() => {
    const entries = this.data()?.entries ?? [];
    return entries.filter(e => e.rank <= 3).sort((a, b) => a.rank - b.rank);
  });

  filtered = computed(() => {
    const entries = this.data()?.entries ?? [];
    const q = this.searchQuery.toLowerCase().trim();
    return entries.filter(e => !q || e.username.toLowerCase().includes(q));
  });

  tableEntries = computed(() => {
    return this.filtered().filter(e => e.rank > 3);
  });

  totalPages() {
    const d = this.data();
    if (!d) return 1;
    return Math.ceil(d.total / d.limit);
  }

  isOnPage(): boolean {
    const username = this.authService.user()?.username;
    return this.data()?.entries.some(e => e.username === username) ?? false;
  }

  ngOnInit(): void { this.load(); }

  setPeriod(p: 'global' | 'weekly'): void {
    this.period.set(p);
    this.page.set(1);
    this.load();
  }

  setPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  setLang(id: string): void {
    this.activeLang.set(id);
    this.page.set(1);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const lang = this.activeLang() !== 'all' ? `&language=${this.activeLang()}` : '';
    this.http.get<LeaderboardResponse>(
      `${environment.apiUrl}/leaderboard?period=${this.period()}&page=${this.page()}&limit=25${lang}`
    ).subscribe({
      next:  d => { this.data.set(d); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }
}
