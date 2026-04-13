import { Component, computed, signal, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { NgxSilkComponent } from '@omnedia/ngx-silk';
import { environment } from '../../../environments/environment';
import { getRank, getNextRank, getRankProgress } from '../../core/constants/ranks';
import { RankModalService } from '../../core/services/rank-modal.service';

interface DailyChallenge {
  id: string; title: string; description: string; difficulty: string; date: string;
}

function countUp(el: HTMLElement, target: number, duration = 700) {
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toString();
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgxSilkComponent],
  template: `

    <!-- ─── INTRO SCREEN ───────────────────────────────────────────────── -->
    @if (showIntro()) {
      <div class="intro-screen" [class.intro-exiting]="introExiting()">

        <om-silk class="intro-silk" color="#22c55e"
          [speed]="0.025" [scale]="2.2" [noiseIntensity]="2.5" [rotation]="12">
        </om-silk>
        <div class="intro-overlay"></div>

        <!-- Big background percentage counter -->
        <div class="intro-bg-count">
          <div class="intro-bg-inner">
            <span class="intro-bg-num">{{ introCount() }}</span>
            <span class="intro-bg-pct">%</span>
          </div>
        </div>

        <!-- Center content -->
        <div class="intro-center">
          <div class="intro-icon">⚔</div>

          <div class="intro-title-clip">
            <h1 class="intro-title">MatchMood</h1>
          </div>

          <p class="intro-tagline">Code. Compete. Conquer.</p>
          <p class="intro-welcome">Welcome, <span class="intro-username">{{ authService.user()?.username }}</span></p>

          <div class="intro-bar-track">
            <div class="intro-bar-fill"></div>
          </div>
          <span class="intro-ready">Ready →</span>
        </div>

      </div>
    }

    @if (authService.user(); as user) {
    <div class="db-root">

      <!-- GitHub nudge modal -->
      @if (showGithubNudge()) {
        <div class="nudge-bd" (click)="showGithubNudge.set(false)">
          <div class="nudge-modal" (click)="$event.stopPropagation()">
            <button class="nudge-close" (click)="showGithubNudge.set(false)">✕</button>
            <div class="nudge-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </div>
            <h3 class="nudge-title">Connect your GitHub</h3>
            <p class="nudge-desc">Linking GitHub adds your coding identity — recruiters find you faster and your avatar syncs automatically.</p>
            <div class="nudge-benefits">
              <div class="nb"><span class="nb-dot">✓</span> GitHub avatar on your profile</div>
              <div class="nb"><span class="nb-dot">✓</span> Verified developer badge</div>
              <div class="nb"><span class="nb-dot">✓</span> More visibility to recruiters</div>
            </div>
            <a [href]="githubUrl" class="nudge-btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Connect GitHub
            </a>
            <button class="nudge-btn-skip" (click)="showGithubNudge.set(false)">Maybe later</button>
          </div>
        </div>
      }

      <!-- ── Top bar ── -->
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">Welcome back, <span class="accent">{{ user.username }}</span></h1>
          <p class="topbar-sub">{{ greetingSub() }}</p>
        </div>
        <div class="topbar-right">
          <div class="social-links">
            <a href="https://github.com/matchmood" target="_blank" class="social-btn" title="GitHub">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a href="https://twitter.com/matchmood" target="_blank" class="social-btn" title="Twitter / X">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <!-- ── Main two-panel ── -->
      <div class="panels">

        <!-- LEFT: Arena -->
        <div class="panel panel-left">
          <div class="panel-hd">
            <span class="panel-title">ARENA</span>
            <span class="live-dot-wrap"><span class="live-dot"></span> Live matchmaking</span>
          </div>

          <!-- Arena hero -->
          <a routerLink="/arena" class="arena-hero">
            <div class="ah-glow"></div>
            <div class="ah-glow ah-glow-2"></div>
            <div class="ah-body">
              <div class="ah-left">
                <div class="ah-tag-row">
                  <span class="ah-dot"></span>
                  <span class="ah-tag">1V1 · AI-GENERATED · RATED</span>
                </div>
                <h2 class="ah-title">Enter the Arena</h2>
                <p class="ah-desc">Get matched with a dev at your level and compete in a live coding challenge.</p>
                <div class="ah-pills">
                  <span class="ah-pill">⚡ AI-matched</span>
                  <span class="ah-pill">🏆 Rated</span>
                  <span class="ah-pill">⏱ 20 min</span>
                </div>
              </div>
              <div class="ah-right">
                <span class="ah-btn">Play now →</span>
              </div>
            </div>
          </a>

          <!-- Daily + Streak -->
          <div class="sub-row">
            @if (dailyChallenge(); as dc) {
              <a routerLink="/arena" class="sub-card sub-daily">
                <div class="sc-top">
                  <span class="sc-eyebrow">Daily Challenge</span>
                  <span class="diff-pill diff-{{ dc.difficulty.toLowerCase() }}">{{ dc.difficulty }}</span>
                </div>
                <span class="sc-title">{{ dc.title }}</span>
                <div class="sc-meta">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span>Resets in {{ hoursLeft() }}h</span>
                </div>
                <div class="sc-footer">
                  <span class="sc-btn">Solve today →</span>
                  <span class="sc-xp">+50 XP</span>
                </div>
              </a>
            } @else {
              <div class="sub-card sub-daily loading-card">
                <div class="skel" style="width:90px;height:9px"></div>
                <div class="skel" style="width:160px;height:16px;margin-top:4px"></div>
                <div class="skel" style="width:110px;height:9px"></div>
              </div>
            }

            <div class="sub-card sub-streak" [class.streak-on]="user.currentStreak > 0">
              <div class="sc-top">
                <span class="sc-eyebrow">Current Streak</span>
                @if (user.currentStreak >= 7) { <span class="fire-tag">🔥 On fire</span> }
              </div>
              @if (user.currentStreak === 0) {
                <p class="streak-motivate">Play today to start your streak — consistency beats talent.</p>
              }
              <div class="streak-display">
                <span class="streak-emoji">{{ user.currentStreak > 0 ? '🔥' : '🪵' }}</span>
                <div class="streak-nums">
                  <span class="streak-n" [class.streak-green]="user.currentStreak > 0">{{ user.currentStreak }}</span>
                  <span class="streak-u">day{{ user.currentStreak !== 1 ? 's' : '' }}</span>
                </div>
                <div class="streak-meta">
                  <span class="streak-best-inline">Best <strong>{{ user.longestStreak }}d</strong></span>
                </div>
              </div>
              <div class="streak-week">
                <div class="streak-day-labels">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
                <div class="streak-bars">
                  @for (d of streakDots(user.currentStreak); track $index) {
                    <div class="sb" [class.sb-on]="d"></div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Leaderboard -->
        <div class="panel panel-right">
          <div class="panel-hd">
            <span class="panel-title">LEADERBOARD</span>
            <a routerLink="/leaderboard" class="panel-link">View all →</a>
          </div>

          <!-- Podium top 3 -->
          <div class="lb-podium">
            <!-- #2 -->
            <div class="pod-slot pod-2">
              <div class="pod-av-wrap">
                <img class="pod-av pod-av-silver" [src]="'https://api.dicebear.com/7.x/initials/svg?seed=' + topPlayers[1].username" />
              </div>
              <span class="pod-name">{{ topPlayers[1].username }}</span>
              <span class="pod-elo pod-silver">{{ topPlayers[1].rating }}</span>
              <span class="pod-wr">{{ winRateOf(topPlayers[1]) }}% WR</span>
              <div class="pod-bar pod-bar-2"></div>
            </div>
            <!-- #1 -->
            <div class="pod-slot pod-1">
              <span class="pod-crown">👑</span>
              <div class="pod-av-wrap">
                <img class="pod-av pod-av-gold" [src]="'https://api.dicebear.com/7.x/initials/svg?seed=' + topPlayers[0].username" />
              </div>
              <span class="pod-name pod-name-gold">{{ topPlayers[0].username }}</span>
              <span class="pod-elo pod-gold">{{ topPlayers[0].rating }}</span>
              <span class="pod-wr">{{ winRateOf(topPlayers[0]) }}% WR</span>
              <div class="pod-bar pod-bar-1"></div>
            </div>
            <!-- #3 -->
            <div class="pod-slot pod-3">
              <div class="pod-av-wrap">
                <img class="pod-av pod-av-bronze" [src]="'https://api.dicebear.com/7.x/initials/svg?seed=' + topPlayers[2].username" />
              </div>
              <span class="pod-name">{{ topPlayers[2].username }}</span>
              <span class="pod-elo pod-bronze">{{ topPlayers[2].rating }}</span>
              <span class="pod-wr">{{ winRateOf(topPlayers[2]) }}% WR</span>
              <div class="pod-bar pod-bar-3"></div>
            </div>
          </div>

          <!-- Rows #4–7 -->
          <div class="lb-list">
            @for (p of topPlayers.slice(3); track p.rank) {
              <div class="lb-row" [class.lb-me]="p.username === user.username">
                <span class="lb-rank">#{{ p.rank }}</span>
                <img class="lb-av" [src]="'https://api.dicebear.com/7.x/initials/svg?seed=' + p.username" />
                <div class="lb-info">
                  <span class="lb-name" [class.lb-me-name]="p.username === user.username">{{ p.username }}</span>
                  <span class="lb-lang">{{ p.lang }}</span>
                </div>
                <div class="lb-right">
                  <span class="lb-elo">{{ p.rating }}</span>
                  <span class="lb-wr">{{ winRateOf(p) }}% WR</span>
                </div>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- ── Stats strip ── -->
      <div class="stats-strip">

        <div class="stat-item stat-wins">
          <div class="stat-icon-box stat-icon-green">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="stat-body">
            <span #winsEl class="stat-big green">{{ user.wins }}</span>
            <span class="stat-lbl">Wins</span>
          </div>
        </div>

        <div class="stat-div"></div>

        <div class="stat-item stat-losses">
          <div class="stat-icon-box stat-icon-red">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div class="stat-body">
            <span #lossesEl class="stat-big red">{{ user.losses }}</span>
            <span class="stat-lbl">Losses</span>
          </div>
        </div>

        <div class="stat-div"></div>

        <div class="stat-item">
          <div class="stat-icon-box stat-icon-green">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-big" [class.green]="winRate()>=50" [class.amber]="winRate()>0&&winRate()<50" [class.muted]="winRate()===0">{{ winRate() }}%</span>
            <span class="stat-lbl">Win Rate</span>
          </div>
        </div>

        <div class="stat-div"></div>

        <div class="stat-item">
          <div class="stat-icon-box stat-icon-green">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M16.5 3.5l4 4-1.5 1.5-4-4M10 9l-7 7 1.5 1.5 7-7"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-big">{{ totalMatches() }}</span>
            <span class="stat-lbl">Matches</span>
          </div>
        </div>

        <div class="stat-div"></div>

        <div class="stat-item">
          <div class="stat-icon-box stat-icon-green">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div class="stat-body">
            <span class="stat-big" [class.green]="user.currentStreak>0">{{ user.currentStreak }}</span>
            <span class="stat-lbl">Streak</span>
          </div>
        </div>

        <div class="stat-div"></div>

        <!-- Rating -->
        <div class="stat-item stat-rating" (click)="rankModal.open(user.rating)" title="Click to see all ranks">
          <div class="rating-block">
            <div class="rb-top">
              <span class="rb-rank-icon">{{ userRank(user.rating).icon }}</span>
              <span class="rb-rank" [style.color]="userRank(user.rating).color">{{ userRank(user.rating).label }}</span>
              @if (userNextRank(user.rating); as next) {
                <span class="rb-arrow">→</span>
                <span class="rb-next">{{ next.label }}</span>
              } @else {
                <span class="rb-next rb-next-max">Max rank</span>
              }
              <span class="rb-hint">↗ All ranks</span>
            </div>
            <div class="rb-track">
              <div class="rb-fill"
                [style.width.%]="userRatingProgress(user.rating)"
                [style.background]="'linear-gradient(90deg,' + userRank(user.rating).color + '99,' + userRank(user.rating).color + ')'">
              </div>
            </div>
            <div class="rb-bottom">
              <span class="rb-elo" [style.color]="userRank(user.rating).color">{{ user.rating }} ELO</span>
              <span class="stat-lbl">Rating</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Bottom: Game Modes cards ── -->
      <div class="bottom-row">

        <!-- Game Modes -->
        <div class="bottom-col bottom-col-modes">
          <span class="panel-title" style="padding:0 2px;display:block;margin-bottom:10px">GAME MODES</span>
          <div class="modes-scroll">
            <a routerLink="/arena" class="mode-card mode-live">
              <div class="mc-glow mc-glow-green"></div>
              <div class="mc-top">
                <div class="mc-icon mc-icon-green">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M16.5 3.5l4 4-1.5 1.5-4-4M10 9l-7 7 1.5 1.5 7-7"/></svg>
                </div>
                <span class="mc-badge mc-live">● Live</span>
              </div>
              <div class="mc-body">
                <span class="mc-name">1v1 Duel</span>
                <span class="mc-desc">Classic · AI-matched · ELO rated</span>
              </div>
              <span class="mc-btn mc-btn-green">Enter →</span>
            </a>
            <div class="mode-card mode-soon">
              <div class="mc-top">
                <div class="mc-icon mc-icon-dim">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <span class="mc-badge mc-soon">Soon</span>
              </div>
              <div class="mc-body">
                <span class="mc-name">Free for All</span>
                <span class="mc-desc">Up to 4 devs · Battle royale</span>
              </div>
              <span class="mc-btn mc-btn-dim">Coming soon</span>
            </div>
            <div class="mode-card mode-soon">
              <div class="mc-top">
                <div class="mc-icon mc-icon-dim">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <span class="mc-badge mc-soon">Soon</span>
              </div>
              <div class="mc-body">
                <span class="mc-name">2v2 Team</span>
                <span class="mc-desc">Team up · Collaborative duel</span>
              </div>
              <span class="mc-btn mc-btn-dim">Coming soon</span>
            </div>
          </div>
        </div>

        <!-- Plans -->
        <div class="bottom-col bottom-col-plans">
          <span class="panel-title" style="display:block;margin-bottom:10px">PLANS</span>
          <div class="plans-row">

            <!-- Premium -->
            @if (user.tier === 'FREE' || user.tier === 'PREMIUM') {
              <a routerLink="/subscription" class="plan-card plan-premium">
                <div class="plan-glow plan-glow-teal"></div>
                <div class="plan-head">
                  <div class="plan-icon plan-icon-teal">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div>
                    <span class="plan-name plan-name-teal">Premium</span>
                    <span class="plan-price">$9 <span class="plan-mo">/mo</span></span>
                  </div>
                  @if (user.tier === 'PREMIUM') {
                    <span class="plan-active-badge">Active</span>
                  }
                </div>
                <ul class="plan-perks">
                  <li><span class="perk-dot perk-teal">✓</span> Full match history & stats</li>
                  <li><span class="perk-dot perk-teal">✓</span> Verified developer badge</li>
                  <li><span class="perk-dot perk-teal">✓</span> Priority matchmaking queue</li>
                  <li><span class="perk-dot perk-teal">✓</span> Shareable skill certificate</li>
                </ul>
                @if (user.tier === 'FREE') {
                  <span class="plan-btn plan-btn-teal">Upgrade to Premium →</span>
                }
              </a>
            }

            <!-- Enterprise / Private Room -->
            <a routerLink="/subscription" class="plan-card plan-enterprise">
              <div class="plan-glow plan-glow-purple"></div>
              <div class="plan-head">
                <div class="plan-icon plan-icon-purple">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <span class="plan-name plan-name-purple">Private Room</span>
                  <span class="plan-price">$99 <span class="plan-mo">/mo</span></span>
                </div>
                @if (user.tier === 'ENTERPRISE') {
                  <span class="plan-active-badge plan-active-purple">Active</span>
                }
              </div>
              <ul class="plan-perks">
                <li><span class="perk-dot perk-purple">✓</span> Create private custom matches</li>
                <li><span class="perk-dot perk-purple">✓</span> Perfect for tech interviews</li>
                <li><span class="perk-dot perk-purple">✓</span> Team practice & competitions</li>
                <li><span class="perk-dot perk-purple">✓</span> All Premium perks included</li>
              </ul>
              @if (user.tier !== 'ENTERPRISE') {
                <span class="plan-btn plan-btn-purple">Unlock Private Room →</span>
              }
            </a>

          </div>
        </div>

      </div>


    </div>
    }
  `,
  styles: [`
    /* ── Root ── */
    .db-root {
      flex: 1; display: flex; flex-direction: column; overflow-y: auto;
      padding: 20px 24px; gap: 14px; min-height: 0;
      animation: fadeUp 200ms ease both;
    }
    @keyframes fadeUp { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }

    /* ── Topbar ── */
    .topbar { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .topbar-left {}
    .topbar-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 2px; color: #fff; }
    .topbar-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }
    .accent { color: var(--green); }
    .topbar-right { display: flex; align-items: center; gap: 12px; }

    .social-links { display: flex; align-items: center; gap: 4px; }
    .social-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 8px;
      color: #4ade80; background: rgba(255,255,255,0.04);
      border: 1px solid var(--border); text-decoration: none;
      transition: color 150ms, border-color 150ms, background 150ms;
    }
    .social-btn:hover { color: var(--green); border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.06); }
    @keyframes blink { 0%,100%{opacity:1;box-shadow:0 0 6px var(--green)} 50%{opacity:.4;box-shadow:0 0 12px var(--green)} }

    .profile-btn { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 999px; padding: 5px 14px 5px 5px; text-decoration: none; transition: border-color 150ms, background 150ms; cursor: pointer; }
    .profile-btn:hover { border-color: var(--border-bright); background: rgba(255,255,255,0.07); }
    .profile-av { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; background: var(--bg-elevated); }
    .profile-name { font-size: 13px; font-weight: 600; color: var(--text-secondary); }

    /* ── Panels ── */
    .panels { display: flex; gap: 14px; min-height: 0; flex: 0 0 auto; }

    .panel {
      background: rgba(18,18,18,0.50);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px;
      backdrop-filter: blur(2px);
      overflow: hidden;
      box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
    }
    .panel-hd { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .panel-title { font-size: 10px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
    .panel-link { font-size: 11px; color: var(--green); text-decoration: none; opacity: 0.9; transition: opacity 150ms; }
    .panel-link:hover { opacity: 1; }
    .live-dot-wrap { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.45); }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: blink 2s ease infinite; }

    /* LEFT panel */
    .panel-left {
      flex: 1; display: flex; flex-direction: column; gap: 0;
      border-color: rgba(34,197,94,0.25) !important;
      box-shadow: 0 0 40px rgba(34,197,94,0.08);
    }
    .panel-left .panel-hd { flex-shrink: 0; }
    /* ── Leaderboard podium ── */
    .lb-podium {
      display: flex; align-items: flex-end; justify-content: center;
      gap: 0; padding: 20px 12px 0; border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .pod-slot { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; position: relative; }
    .pod-crown { font-size: 18px; line-height: 1; margin-bottom: 2px; filter: drop-shadow(0 0 6px rgba(251,191,36,0.8)); }
    .pod-av-wrap { position: relative; }
    .pod-av { border-radius: 50%; object-fit: cover; display: block; }
    .pod-av-gold   { width: 56px; height: 56px; border: 2px solid #fbbf24; box-shadow: 0 0 16px rgba(251,191,36,0.45); }
    .pod-av-silver { width: 44px; height: 44px; border: 2px solid #94a3b8; box-shadow: 0 0 10px rgba(148,163,184,0.3); }
    .pod-av-bronze { width: 38px; height: 38px; border: 2px solid #f97316; box-shadow: 0 0 10px rgba(249,115,22,0.3); }
    .pod-name { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.9); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70px; }
    .pod-name-gold { color: #fde68a; text-shadow: 0 0 10px rgba(251,191,36,0.4); }
    .pod-elo { font-size: 15px; font-weight: 900; letter-spacing: -0.5px; }
    .pod-gold   { color: #fbbf24; text-shadow: 0 0 16px rgba(251,191,36,0.7); }
    .pod-silver { color: #e2e8f0; text-shadow: 0 0 12px rgba(148,163,184,0.6); }
    .pod-bronze { color: #fb923c; text-shadow: 0 0 12px rgba(249,115,22,0.6); }
    .pod-wr { font-size: 10px; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
    .pod-bar { width: 100%; border-radius: 4px 4px 0 0; }
    .pod-bar-1 { height: 36px; background: linear-gradient(180deg, rgba(251,191,36,0.45), rgba(251,191,36,0.06)); border-top: 2px solid rgba(251,191,36,0.7); }
    .pod-bar-2 { height: 24px; background: linear-gradient(180deg, rgba(148,163,184,0.35), rgba(148,163,184,0.05)); border-top: 2px solid rgba(148,163,184,0.5); }
    .pod-bar-3 { height: 16px; background: linear-gradient(180deg, rgba(249,115,22,0.35), rgba(249,115,22,0.05)); border-top: 2px solid rgba(249,115,22,0.5); }

    /* ── Leaderboard list (#4–) ── */
    .lb-list { display: flex; flex-direction: column; }
    .lb-row {
      display: flex; align-items: center; gap: 9px;
      padding: 9px 14px; border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 150ms ease;
    }
    .lb-row:last-child { border-bottom: none; }
    .lb-row:hover { background: rgba(255,255,255,0.05); }
    .lb-me { background: rgba(34,197,94,0.08) !important; border-left: 2px solid rgba(34,197,94,0.5); }
    .lb-rank { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); width: 20px; flex-shrink: 0; }
    .lb-av { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); flex-shrink: 0; }
    .lb-info { display: flex; flex-direction: column; flex: 1; gap: 1px; min-width: 0; }
    .lb-name { font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .lb-me-name { color: var(--green); text-shadow: 0 0 10px rgba(34,197,94,0.4); }
    .lb-lang { font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; }
    .lb-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex-shrink: 0; }
    .lb-elo { font-size: 13px; font-weight: 900; color: #fff; }
    .lb-wr { font-size: 10px; color: rgba(255,255,255,0.45); }

    /* RIGHT panel */
    .panel-right { width: 280px; flex-shrink: 0; }

    /* Arena hero inside right panel */
    /* ── Arena hero ── */
    .arena-hero {
      display: block; text-decoration: none; flex-shrink: 0;
      background: linear-gradient(160deg, #071407 0%, #0d2010 60%, #071407 100%);
      border-bottom: 1px solid rgba(34,197,94,0.3);
      box-shadow: 0 1px 8px rgba(34,197,94,0.1);
      padding: 24px 22px; position: relative; overflow: hidden;
      transition: border-color 200ms, background 200ms;
    }
    .arena-hero:hover { border-color: rgba(34,197,94,0.45); background: linear-gradient(160deg, #071407 0%, #0c1f0c 60%, #071407 100%); }
    .ah-glow {
      position: absolute; border-radius: 50%; pointer-events: none;
      width: 420px; height: 320px; top: -100px; right: -60px;
      background: radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 65%);
      animation: gf1 12s ease-in-out infinite;
    }
    .ah-glow-2 {
      width: 260px; height: 260px; top: auto; bottom: -80px; left: 40%;
      background: radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 65%);
      animation: gf2 16s ease-in-out infinite;
    }
    @keyframes gf1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,12px)} }
    @keyframes gf2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-10px)} }

    .ah-body { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; gap: 20px; }
    .ah-left { display: flex; flex-direction: column; gap: 10px; }
    .ah-tag-row { display: flex; align-items: center; gap: 7px; }
    .ah-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 10px var(--green); flex-shrink: 0; animation: blink 2s ease infinite; }
    .ah-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--green); opacity: 1; }
    .ah-title { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -1.2px; margin: 0; line-height: 1.05; text-shadow: 0 0 40px rgba(34,197,94,0.15); }
    .ah-desc { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.5; max-width: 420px; margin: 0; }
    .ah-pills { display: flex; gap: 6px; flex-wrap: wrap; }
    .ah-pill { font-size: 11px; font-weight: 600; color: #4ade80; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); padding: 3px 10px; border-radius: 999px; }
    .ah-right { flex-shrink: 0; }
    .ah-btn {
      display: inline-block; background: var(--green); color: #000;
      font-size: 13px; font-weight: 800; padding: 11px 24px;
      border-radius: 8px; white-space: nowrap;
      transition: background 150ms, transform 100ms; letter-spacing: 0.02em;
    }
    .arena-hero:hover .ah-btn { background: #16a34a; transform: translateX(2px); }

    /* ── Sub row ── */
    .sub-row { display: flex; gap: 0; flex: 1; min-height: 0; }
    .sub-card {
      flex: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px;
      border-right: 1px solid rgba(34,197,94,0.3);
      box-shadow: 2px 0 8px rgba(34,197,94,0.1);
      overflow: hidden; position: relative;
    }
    .sub-card:last-child { border-right: none; box-shadow: none; }
    .sub-daily {
      text-decoration: none; cursor: pointer; transition: background 150ms;
    }
    .sub-daily:hover { background: rgba(34,197,94,0.03); }
    .sub-streak.streak-on { background: rgba(34,197,94,0.04); }

    .sc-top { display: flex; justify-content: space-between; align-items: center; }
    .sc-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
    .sc-title { font-size: 16px; font-weight: 800; color: #fff; line-height: 1.3; }
    .sc-meta { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.4); }
    .sc-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
    .sc-btn {
      font-size: 12px; font-weight: 800; color: #000;
      background: var(--green); padding: 6px 14px; border-radius: 7px;
      letter-spacing: 0.02em; transition: background 150ms;
    }
    .sub-daily:hover .sc-btn { background: #16a34a; }
    .sc-xp { font-size: 11px; font-weight: 700; color: rgba(34,197,94,0.7); background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); padding: 4px 9px; border-radius: 999px; }

    .diff-pill { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; letter-spacing: 0.04em; }
    .diff-easy   { background: rgba(34,197,94,0.12); color: var(--green); }
    .diff-medium { background: rgba(245,158,11,0.12); color: #f59e0b; }
    .diff-hard   { background: rgba(239,68,68,0.12); color: #ef4444; }

    .fire-tag { font-size: 10px; font-weight: 700; color: #f97316; background: rgba(249,115,22,0.1); padding: 2px 7px; border-radius: 999px; }

    .streak-display { display: flex; align-items: center; gap: 10px; }
    .streak-emoji { font-size: 30px; line-height: 1; flex-shrink: 0; }
    .streak-nums { display: flex; align-items: baseline; gap: 3px; }
    .streak-n { font-size: 38px; font-weight: 900; letter-spacing: -2px; line-height: 1; color: rgba(255,255,255,0.45); }
    .streak-green { color: var(--green) !important; text-shadow: 0 0 24px rgba(34,197,94,0.5); }
    .streak-u { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.4); }
    .streak-meta { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; }
    .streak-best-inline { font-size: 11px; color: rgba(255,255,255,0.4); }
    .streak-best-inline strong { color: rgba(255,255,255,0.7); }
    .streak-motivate { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.5; margin: 0; font-style: italic; }
    .streak-week { display: flex; flex-direction: column; gap: 4px; }
    .streak-day-labels { display: flex; gap: 4px; }
    .streak-day-labels span { flex: 1; text-align: center; font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.04em; }
    .streak-bars { display: flex; gap: 4px; }
    .sb { flex: 1; height: 6px; background: rgba(255,255,255,0.07); border-radius: 3px; transition: background 300ms; }
    .sb.sb-on { background: var(--green); box-shadow: 0 0 8px rgba(34,197,94,0.55); }

    .skel { background: var(--bg-elevated); border-radius: 4px; animation: shimmer 1.4s ease infinite; }
    .loading-card { opacity: 0.4; }
    @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

    /* ── Stats strip ── */
    .stats-strip {
      display: flex; align-items: stretch;
      background: rgba(18,18,18,0.50); border: 1px solid rgba(255,255,255,0.09);
      border-radius: 14px; padding: 0; gap: 0;
      backdrop-filter: blur(14px); flex-shrink: 0; overflow: hidden;
    }
    .stat-item {
      display: flex; align-items: center; gap: 12px; flex: 1;
      padding: 16px 20px; position: relative;
      transition: background 150ms;
    }
    .stat-item:hover { background: rgba(255,255,255,0.025); }
    .stat-wins  { background: rgba(34,197,94,0.08); }
    .stat-losses{ background: rgba(248,113,113,0.08); }
    .stat-icon-box {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon-green {
      background: rgba(34,197,94,0.1); color: var(--green);
      border: 1px solid rgba(34,197,94,0.2);
    }
    .stat-icon-red {
      background: rgba(248,113,113,0.1); color: #f87171;
      border: 1px solid rgba(248,113,113,0.2);
    }
    .stat-body { display: flex; flex-direction: column; gap: 2px; }
    .stat-div { width: 1px; background: rgba(255,255,255,0.07); flex-shrink: 0; align-self: stretch; }
    .stat-big { font-size: 26px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; color: #fff; }
    .stat-big.green { color: #4ade80; text-shadow: 0 0 24px rgba(34,197,94,0.6); }
    .stat-big.red   { color: #f87171; text-shadow: 0 0 24px rgba(248,113,113,0.5); }
    .stat-big.amber { color: #fbbf24; }
    .stat-big.muted { color: rgba(255,255,255,0.3); }
    .stat-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); }

    /* Rating block */
    .stat-rating { flex: 2; cursor: pointer; }
    .stat-rating:hover { background: rgba(255,255,255,0.04); }
    .rating-block { display: flex; flex-direction: column; gap: 6px; width: 100%; }
    .rb-top { display: flex; align-items: center; gap: 6px; }
    .rb-rank-icon { font-size: 16px; line-height: 1; }
    .rb-rank { font-size: 15px; font-weight: 900; letter-spacing: -0.3px; }
    .rb-arrow { font-size: 12px; color: rgba(255,255,255,0.25); }
    .rb-next { font-size: 11px; color: rgba(255,255,255,0.4); }
    .rb-next-max { color: rgba(255,200,50,0.6); }
    .rb-hint { font-size: 10px; color: rgba(255,255,255,0.2); margin-left: auto; font-weight: 600; letter-spacing: 0.04em; }
    .stat-rating:hover .rb-hint { color: rgba(255,255,255,0.4); }
    .rb-track {
      height: 5px; background: rgba(255,255,255,0.07);
      border-radius: 999px; overflow: hidden;
    }
    .rb-fill {
      height: 100%; border-radius: 999px;
      transition: width 900ms cubic-bezier(.4,0,.2,1);
      box-shadow: 0 0 8px rgba(74,222,128,0.4);
    }
    .rb-bottom { display: flex; align-items: center; justify-content: space-between; }
    .rb-elo { font-size: 12px; font-weight: 800; }

    /* ── Bottom: Game Modes ── */
    /* ── Bottom row ── */
    .bottom-row { display: flex; gap: 16px; flex-shrink: 0; align-items: stretch; }
    .bottom-col { display: flex; flex-direction: column; }
    .bottom-col-modes { flex-shrink: 0; }
    .bottom-col-plans { flex: 1; min-width: 0; }

    .modes-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 6px 2px 8px; flex: 1; align-items: stretch; }
    .modes-scroll::-webkit-scrollbar { height: 3px; }
    .modes-scroll::-webkit-scrollbar-track { background: transparent; }
    .modes-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    .mode-card {
      flex: 0 0 200px; display: flex; flex-direction: column; gap: 10px;
      background: rgba(20,20,20,0.50); border: 1px solid rgba(255,255,255,0.08); height: auto;
      border-radius: 14px; padding: 16px 16px 14px;
      backdrop-filter: blur(2px); transition: border-color 180ms, transform 160ms, box-shadow 180ms;
      position: relative; overflow: hidden; text-decoration: none;
    }
    .mc-body { display: flex; flex-direction: column; gap: 4px; flex: 1; }

    /* States */
    .mode-live   { border-color: rgba(34,197,94,0.45); box-shadow: 0 0 20px rgba(34,197,94,0.1); }
    .mode-live:hover   { border-color: rgba(34,197,94,0.7); transform: translateY(-3px); box-shadow: 0 10px 30px rgba(34,197,94,0.2); }
    .mode-soon   { opacity: 0.5; pointer-events: none; }
    .mode-premium  { border-color: rgba(74,222,128,0.28); }
    .mode-premium:hover  { border-color: rgba(74,222,128,0.6); transform: translateY(-3px); box-shadow: 0 10px 30px rgba(74,222,128,0.14); }
    .mode-enterprise { border-color: rgba(139,92,246,0.28); }
    .mode-enterprise:hover { border-color: rgba(139,92,246,0.6); transform: translateY(-3px); box-shadow: 0 10px 30px rgba(139,92,246,0.16); }

    /* Glows */
    .mc-glow { position: absolute; width: 160px; height: 160px; top: -70px; right: -50px; border-radius: 50%; pointer-events: none; }
    .mc-glow-green  { background: radial-gradient(circle, rgba(34,197,94,0.28) 0%, transparent 70%); }
    .mc-glow-teal   { background: radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 70%); }
    .mc-glow-purple { background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%); }

    /* Top row */
    .mc-top { display: flex; justify-content: space-between; align-items: center; }
    .mc-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mc-icon-green  { background: rgba(34,197,94,0.1);  color: var(--green);  border: 1px solid rgba(34,197,94,0.2); }
    .mc-icon-dim    { background: var(--bg-elevated);    color: var(--text-muted); border: 1px solid var(--border); }
    .mc-icon-teal   { background: rgba(74,222,128,0.1);  color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
    .mc-icon-purple { background: rgba(139,92,246,0.1); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2); }

    /* Badges */
    .mc-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; letter-spacing: 0.05em; white-space: nowrap; }
    .mc-live            { background: rgba(34,197,94,0.12);  color: var(--green);  border: 1px solid rgba(34,197,94,0.2); }
    .mc-soon            { background: var(--bg-elevated); color: var(--text-muted); }
    .mc-premium-badge   { background: rgba(74,222,128,0.1);  color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
    .mc-enterprise-badge{ background: rgba(139,92,246,0.1); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2); }

    /* Names */
    .mc-name        { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
    .mc-name-teal   { color: #4ade80; }
    .mc-name-purple { color: #a78bfa; }
    .mc-desc { font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.45; }

    /* Buttons */
    .mc-btn { display: inline-block; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 8px; align-self: flex-start; transition: background 150ms, transform 100ms; letter-spacing: 0.02em; margin-top: 2px; }
    .mc-btn-green  { background: var(--green); color: #000; }
    .mode-live:hover .mc-btn-green { background: #16a34a; }
    .mc-btn-dim    { background: var(--bg-elevated); color: var(--text-muted); cursor: default; }
    .mc-btn-teal   { background: rgba(74,222,128,0.15); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
    .mode-premium:hover .mc-btn-teal { background: rgba(74,222,128,0.25); }
    .mc-btn-purple { background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); }
    .mode-enterprise:hover .mc-btn-purple { background: rgba(139,92,246,0.25); }

    /* ── Plan cards ── */
    .plans-row { display: flex; gap: 12px; padding: 6px 2px 8px; }
    .plan-card {
      flex: 1; display: flex; flex-direction: column; gap: 12px;
      background: rgba(20,20,20,0.85); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px; padding: 16px 18px;
      backdrop-filter: blur(16px); text-decoration: none;
      position: relative; overflow: hidden;
      transition: border-color 180ms, transform 160ms, box-shadow 180ms;
    }
    .plan-premium   { border-color: rgba(74,222,128,0.45); background: rgba(34,197,94,0.07); }
    .plan-premium:hover { border-color: rgba(74,222,128,0.75); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(74,222,128,0.22); }
    .plan-enterprise { border-color: rgba(139,92,246,0.45); background: rgba(139,92,246,0.07); }
    .plan-enterprise:hover { border-color: rgba(139,92,246,0.75); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(139,92,246,0.22); }

    .plan-glow { position: absolute; width: 260px; height: 260px; top: -100px; right: -70px; border-radius: 50%; pointer-events: none; }
    .plan-glow-teal   { background: radial-gradient(circle, rgba(74,222,128,0.28) 0%, transparent 65%); }
    .plan-glow-purple { background: radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 65%); }

    .plan-head { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
    .plan-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .plan-icon-teal   { background: rgba(74,222,128,0.18); color: #4ade80; border: 1px solid rgba(74,222,128,0.35); }
    .plan-icon-purple { background: rgba(139,92,246,0.18); color: #a78bfa; border: 1px solid rgba(139,92,246,0.35); }
    .plan-name { display: block; font-size: 14px; font-weight: 800; letter-spacing: -0.2px; }
    .plan-name-teal   { color: #4ade80; }
    .plan-name-purple { color: #a78bfa; }
    .plan-price { display: block; font-size: 18px; font-weight: 900; color: var(--text-primary); letter-spacing: -0.5px; line-height: 1.1; margin-top: 1px; }
    .plan-mo { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.4); }
    .plan-active-badge { margin-left: auto; font-size: 10px; font-weight: 700; background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.25); padding: 2px 8px; border-radius: 999px; flex-shrink: 0; }
    .plan-active-purple { background: rgba(139,92,246,0.12); color: #a78bfa; border-color: rgba(139,92,246,0.25); }

    .plan-perks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; flex: 1; position: relative; z-index: 1; }
    .plan-perks li { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.65); line-height: 1.3; }
    .perk-dot { font-size: 11px; font-weight: 800; flex-shrink: 0; }
    .perk-teal   { color: #4ade80; }
    .perk-purple { color: #a78bfa; }

    .plan-btn { display: inline-block; font-size: 12px; font-weight: 800; padding: 9px 18px; border-radius: 8px; align-self: flex-start; transition: background 150ms; letter-spacing: 0.02em; position: relative; z-index: 1; }
    .plan-btn-teal   { background: rgba(74,222,128,0.22); color: #4ade80; border: 1px solid rgba(74,222,128,0.5); }
    .plan-premium:hover .plan-btn-teal { background: rgba(74,222,128,0.35); }
    .plan-btn-purple { background: rgba(139,92,246,0.22); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.5); }
    .plan-enterprise:hover .plan-btn-purple { background: rgba(139,92,246,0.35); }

    /* ── Nudge modal ── */
    .nudge-bd { position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; }
    .nudge-modal { background: rgba(13,13,13,0.97); border: 1px solid var(--border-bright); border-radius: 16px; padding: 32px 28px; max-width: 400px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; animation: cardIn 280ms ease both; }
    .nudge-close { position: absolute; top: 14px; right: 14px; background: none; border: none; color: var(--text-muted); font-size: 14px; cursor: pointer; padding: 4px; }
    .nudge-close:hover { color: var(--text-primary); }
    .nudge-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; color: var(--text-primary); }
    .nudge-title { font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0; text-align: center; }
    .nudge-desc { font-size: 13px; color: var(--text-muted); text-align: center; line-height: 1.5; margin: 0; }
    .nudge-benefits { width: 100%; display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; background: var(--bg-elevated); border-radius: 10px; border: 1px solid var(--border); }
    .nb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
    .nb-dot { color: var(--green); font-weight: 700; }
    .nudge-btn-primary { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #fff; color: #000; border: none; border-radius: 10px; padding: 13px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; transition: opacity 150ms; margin-top: 4px; }
    .nudge-btn-primary:hover { opacity: .88; }
    .nudge-btn-skip { background: none; border: none; font-size: 12px; color: var(--text-muted); cursor: pointer; padding: 4px; }
    .nudge-btn-skip:hover { color: var(--text-secondary); }
    @keyframes cardIn { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:none} }

    /* ── Intro / Loading Screen ─────────────────────────────────────────── */
    .intro-screen {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      background: #000;
      overflow: hidden;
    }
    .intro-screen.intro-exiting {
      animation: introExit 500ms cubic-bezier(0.4, 0, 1, 1) forwards;
    }
    @keyframes introExit {
      0%   { opacity: 1; transform: scale(1);    filter: blur(0px); }
      100% { opacity: 0; transform: scale(1.07); filter: blur(6px); }
    }

    /* Silk + overlay */
    .intro-silk {
      position: absolute; inset: 0; z-index: 0;
      animation: introFadeIn 600ms ease forwards;
    }
    .intro-overlay {
      position: absolute; inset: 0; z-index: 1;
      background: rgba(0,0,0,0.62);
      animation: introFadeIn 400ms ease forwards;
    }
    @keyframes introFadeIn { from{opacity:0} to{opacity:1} }

    /* Big background percentage counter */
    .intro-bg-count {
      position: absolute; inset: 0; z-index: 2;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      pointer-events: none; user-select: none;
    }
    .intro-bg-inner {
      display: flex; align-items: flex-start; line-height: 1;
    }
    .intro-bg-num {
      font-size: clamp(120px, 22vw, 260px);
      font-weight: 900;
      line-height: 1;
      color: rgba(148,163,184,0.1);
      letter-spacing: -0.04em;
    }
    .intro-bg-pct {
      font-size: clamp(36px, 7vw, 80px);
      font-weight: 900;
      color: rgba(148,163,184,0.1);
      margin-top: 0.08em;
    }

    /* Center wrapper */
    .intro-center {
      position: relative; z-index: 10;
      display: flex; flex-direction: column; align-items: center; gap: 0;
      text-align: center;
    }

    /* Icon */
    .intro-icon {
      font-size: 36px; margin-bottom: 20px;
      animation: introIconIn 700ms cubic-bezier(0.34,1.56,0.64,1) 200ms both;
      filter: drop-shadow(0 0 18px rgba(34,197,94,0.7));
    }
    @keyframes introIconIn {
      from { opacity: 0; transform: scale(0.3) rotate(-180deg); }
      60%  { transform: scale(1.15) rotate(8deg); }
      to   { opacity: 1; transform: scale(1) rotate(0deg); }
    }

    /* Title clip reveal */
    .intro-title-clip {
      overflow: hidden;
      margin-bottom: 14px;
    }
    .intro-title {
      font-size: clamp(42px, 8vw, 72px);
      font-weight: 900;
      letter-spacing: -2px;
      color: #fff;
      margin: 0;
      text-shadow: 0 0 60px rgba(34,197,94,0.5);
      animation: introTitleReveal 800ms cubic-bezier(0.16,1,0.3,1) 400ms both;
    }
    @keyframes introTitleReveal {
      from { clip-path: inset(0 100% 0 0); opacity: 0.2; }
      to   { clip-path: inset(0 0% 0 0);   opacity: 1; }
    }

    /* Tagline */
    .intro-tagline {
      font-size: 13px; font-weight: 600; letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.35);
      margin: 0 0 18px;
      animation: introFadeUp 500ms ease 1000ms both;
    }

    /* Welcome */
    .intro-welcome {
      font-size: 15px; font-weight: 500;
      color: rgba(255,255,255,0.5);
      margin: 0 0 32px;
      animation: introFadeUp 500ms ease 1300ms both;
    }
    .intro-username {
      color: #22c55e; font-weight: 700;
    }
    @keyframes introFadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: none; }
    }

    /* Progress bar */
    .intro-bar-track {
      width: 200px; height: 2px;
      background: rgba(255,255,255,0.08);
      border-radius: 2px; overflow: hidden;
      animation: introFadeUp 300ms ease 1500ms both;
    }
    .intro-bar-fill {
      height: 100%; width: 0%; border-radius: 2px;
      background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80);
      animation: introBarFill 3500ms cubic-bezier(0.4,0,0.2,1) 1600ms forwards;
      box-shadow: 0 0 8px rgba(34,197,94,0.8);
    }
    @keyframes introBarFill {
      from { width: 0%; }
      to   { width: 100%; }
    }

    /* "Ready →" label */
    .intro-ready {
      font-size: 11px; font-weight: 700; letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #22c55e;
      margin-top: 12px;
      opacity: 0;
      animation: introReadyIn 400ms ease 5400ms forwards;
    }
    @keyframes introReadyIn {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: none; }
    }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChildren('winsEl,lossesEl') countEls!: QueryList<ElementRef<HTMLElement>>;

  dailyChallenge  = signal<DailyChallenge | null>(null);
  showGithubNudge = signal(false);
  githubUrl       = `${environment.apiUrl}/auth/github`;

  // Intro / loading screen
  showIntro    = signal(false);
  introExiting = signal(false);
  introCount   = signal(0);

  topPlayers = [
    { rank: 1, username: 'devking',    lang: 'Rust',       rating: 2140, wins: 87, losses: 12 },
    { rank: 2, username: 'codeflow',   lang: 'TypeScript', rating: 1980, wins: 74, losses: 21 },
    { rank: 3, username: 'nullptr',    lang: 'C++',        rating: 1875, wins: 65, losses: 28 },
    { rank: 4, username: 'bytefury',   lang: 'Go',         rating: 1720, wins: 55, losses: 30 },
    { rank: 5, username: 'asyncwitch', lang: 'Python',     rating: 1680, wins: 50, losses: 33 },
    { rank: 6, username: 'hookmaster', lang: 'JavaScript', rating: 1610, wins: 44, losses: 35 },
    { rank: 7, username: 'rustacean',  lang: 'Rust',       rating: 1555, wins: 40, losses: 38 },
  ];

  constructor(public authService: AuthService, private http: HttpClient, public rankModal: RankModalService) {}

  ngOnInit(): void {
    this.http.get<DailyChallenge>(`${environment.apiUrl}/challenges/daily`)
      .subscribe({ next: (d) => this.dailyChallenge.set(d), error: () => {} });
    if (this.authService.shouldShowGithubNudge()) this.showGithubNudge.set(true);
    this.checkFirstVisit();
  }

  private checkFirstVisit(): void {
    const userId = this.authService.user()?.id;
    if (!userId) return;
    const key = `mm_intro_${userId}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    this.showIntro.set(true);

    // Count 0→100 in ~6s (every 60ms = 100 steps)
    this.introCount.set(0);
    const countInterval = setInterval(() => {
      const next = this.introCount() + 1;
      this.introCount.set(next);
      if (next >= 100) clearInterval(countInterval);
    }, 60);

    // Start exit animation at 6200ms, remove from DOM at 6900ms
    setTimeout(() => this.introExiting.set(true), 6200);
    setTimeout(() => { this.showIntro.set(false); clearInterval(countInterval); }, 6900);
  }

  ngAfterViewInit(): void {
    const user = this.authService.user();
    if (!user) return;
    const targets = [user.wins, user.losses];
    this.countEls.toArray().forEach((ref, i) => countUp(ref.nativeElement, targets[i] ?? 0));
  }

  winRate = computed(() => {
    const u = this.authService.user();
    if (!u) return 0;
    const total = u.wins + u.losses + u.draws;
    return total > 0 ? Math.round((u.wins / total) * 100) : 0;
  });

  totalMatches = computed(() => {
    const u = this.authService.user();
    if (!u) return 0;
    return u.wins + u.losses + u.draws;
  });

  userRank(rating: number)         { return getRank(rating); }
  userNextRank(rating: number)     { return getNextRank(rating); }
  userRatingProgress(rating: number) { return getRankProgress(rating); }

  hoursLeft(): number {
    const now = new Date();
    return 24 - now.getHours();
  }

  streakDots(streak: number): boolean[] {
    const dots = 7;
    return Array.from({ length: dots }, (_, i) => i < Math.min(streak, dots));
  }

  winRateOf(p: { wins: number; losses: number }): number {
    const total = p.wins + p.losses;
    return total > 0 ? Math.round((p.wins / total) * 100) : 0;
  }

  greetingSub(): string {
    const u = this.authService.user();
    if (!u) return '';
    const total = u.wins + u.losses + u.draws;
    if (total === 0) return "You haven't played yet — jump in the arena.";
    if (this.winRate() >= 60) return "You're on a roll. Keep it up.";
    if (this.winRate() >= 40) return "Solid performance. Keep climbing.";
    return "Tough stretch — every loss is a lesson.";
  }
}
