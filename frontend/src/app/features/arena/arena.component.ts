import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { MonacoEditorComponent } from '../../shared/components/monaco-editor.component';
import { NgxAuroraComponent } from '@omnedia/ngx-aurora';
import { NgxSilkComponent }  from '@omnedia/ngx-silk';
import { getRank } from '../../core/constants/ranks';
import { RankModalService } from '../../core/services/rank-modal.service';
import { GameSetupModalService } from '../../core/services/game-setup-modal.service';

type MatchState = 'idle' | 'waiting' | 'match_found' | 'generating' | 'playing' | 'judging' | 'round_result' | 'finished';
type GameMode = '1v1' | '2v2' | 'ffa' | 'private';

interface Challenge {
  title: string;
  description: string;
  level: string;
}

interface SubmissionResult {
  passed: number;
  total: number;
  results: Array<{ passed: boolean; output: string }>;
}

@Component({
  selector: 'app-arena',
  standalone: true,
  imports: [MonacoEditorComponent, RouterLink, FormsModule, NgxAuroraComponent, NgxSilkComponent],
  template: `
    <div class="arena page-enter">

      <!-- ─── Topbar ──────────────────────────────────────────────── -->
      <header class="topbar">
        <div class="topbar-left">
          <div class="topbar-logo">
            <div class="topbar-logo-icon" [style.border-color]="modeColor()" [style.color]="modeColor()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M16.5 3.5l4 4-1.5 1.5-4-4M10 9l-7 7 1.5 1.5 7-7"/></svg>
            </div>
            <span class="topbar-logo-text" [style.color]="modeColor()">Arena</span>
          </div>
        </div>
        <div class="topbar-right">
          @if (state() === 'playing' || state() === 'judging' || state() === 'round_result') {
            <div class="round-indicator">
              @for (r of roundsArray(); track r) {
                <div class="round-dot"
                  [class.won]="myRoundWins() > $index"
                  [class.lost]="opponentRoundWins() > $index"
                  [class.current]="currentRound() === r && state() !== 'round_result'">
                </div>
              }
              <span class="round-label">Round {{ currentRound() }}/{{ winsToWin() }}</span>
            </div>
          }
          @if (authService.user(); as user) {
            <div class="top-elo-chip" (click)="rankModal.open(user.rating)"
              [style.border-color]="userRank(user.rating).color + '55'"
              [style.background]="userRank(user.rating).bgColor">
              <span class="tec-icon">{{ userRank(user.rating).icon }}</span>
              <span class="tec-label" [style.color]="userRank(user.rating).color">{{ userRank(user.rating).label }}</span>
              <span class="tec-sep">·</span>
              <span class="tec-elo">{{ user.rating }} ELO</span>
            </div>
          }
        </div>
      </header>

      <!-- ─── Disconnect banner ───────────────────────────────────── -->
      @if (opponentDisconnected()) {
        <div class="disconnect-banner">
          <span>⚠ Opponent disconnected — waiting {{ disconnectCountdown() }}s for reconnect...</span>
        </div>
      }

      <!-- ─── Challenge modal (shown when round starts) ───────────── -->
      @if (showChallengeModal() && challenge()) {
        <div class="modal-backdrop">
          <div class="challenge-modal">
            <button class="modal-close" (click)="closeModal()">✕</button>

            <div class="modal-header">
              <span class="modal-level level-{{ challenge()!.level.toLowerCase() }}">{{ challenge()!.level }}</span>
              <span class="modal-round">Round {{ currentRound() }}/{{ winsToWin() }}</span>
            </div>

            <h2 class="modal-title">{{ challenge()!.title }}</h2>
            <p class="modal-desc">{{ challenge()!.description }}</p>

            <div class="modal-meta">
              <div class="meta-item">
                <span class="meta-label">Language</span>
                <span class="meta-val">{{ langLabel(language()) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Available</span>
                <span class="meta-val">{{ langAvailable(language()) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Time</span>
                <span class="meta-val">No limit · first to submit wins</span>
              </div>
            </div>

            <div class="modal-footer">
              <div class="countdown-bar">
                <div class="countdown-fill" [style.width.%]="(modalCountdown() / 30) * 100" [style.background]="langColor()"></div>
              </div>
              <span class="countdown-text">Closing in {{ modalCountdown() }}s</span>
              <button class="modal-start-btn" [style.background]="langColor()" (click)="closeModal()">Start coding →</button>
            </div>
          </div>
        </div>
      }

      <!-- ─── Mode mini-navbar ─────────────────────────────────────── -->
      @if (state() === 'idle') {
        <div class="mode-navbar" [style.--mode-color]="modeColor()">
          <button class="mode-tab" [class.active]="selectedMode() === '1v1'" (click)="selectMode('1v1')">
            <span class="tab-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M16.5 3.5l4 4-1.5 1.5-4-4M10 9l-7 7 1.5 1.5 7-7"/></svg>
            </span>
            1v1
          </button>
          <button class="mode-tab" [class.active]="selectedMode() === '2v2'" (click)="selectMode('2v2')">
            <span class="tab-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            2v2 <span class="tab-soon">Soon</span>
          </button>
          <button class="mode-tab" [class.active]="selectedMode() === 'ffa'" (click)="selectMode('ffa')">
            <span class="tab-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </span>
            FFA <span class="tab-soon">Soon</span>
          </button>
          <button class="mode-tab mode-tab-enterprise" [class.active]="selectedMode() === 'private'" (click)="selectMode('private')">
            <span class="tab-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            Private <span class="tab-enterprise">Enterprise</span>
          </button>
        </div>
      }

      <!-- ─── IDLE — centered card ──────────────────────────────────── -->
      @if (state() === 'idle') {
        <om-aurora class="arena-aurora"></om-aurora>
        <div class="screen screen-idle" [style.--mode-color]="modeColor()">
          <div class="idle-card">
            @if (selectedMode() === 'private') {
              <!-- Private Room UI -->
              @if (authService.user()?.tier === 'ENTERPRISE') {
                <div class="private-room-ui">
                  <h1 class="idle-title" style="color:#10b981">Private Room</h1>
                  <p class="idle-desc">Create a room and share the code, or join with an existing code.</p>

                  <!-- Create room -->
                  <div class="room-section">
                    <button class="btn-find" style="background:#10b981" (click)="createRoom()" [disabled]="creatingRoom()">
                      {{ creatingRoom() ? 'Creating...' : 'Create Room' }}
                    </button>
                    @if (roomCode()) {
                      <div class="room-code-display">
                        <span class="room-code-label">Room code</span>
                        <span class="room-code">{{ roomCode() }}</span>
                        <button class="room-code-copy" (click)="copyRoomCode()">{{ codeCopied() ? '✓' : 'Copy' }}</button>
                      </div>
                      <p class="room-note">Share this code. The match starts when someone joins.</p>
                    }
                  </div>

                  <!-- Join room -->
                  <div class="room-divider">or join</div>
                  <div class="room-section">
                    <div class="room-join-row">
                      <input class="room-input" [(ngModel)]="joinCodeInput" placeholder="Enter code (e.g. XK4M2P)" maxlength="6" />
                      <button class="btn-join-room" style="background:#10b981" (click)="joinRoom()">Join</button>
                    </div>
                    @if (roomError()) {
                      <span class="room-error">{{ roomError() }}</span>
                    }
                  </div>
                </div>
              } @else {
                <!-- Paywall -->
                <div class="idle-icon">🏢</div>
                <h1 class="idle-title" style="color:#10b981">Private Room</h1>
                <p class="idle-desc">Create private rooms for technical interviews, team practice, or custom competitions.</p>
                <a routerLink="/subscription" class="btn-find" style="background:#10b981;text-decoration:none;display:inline-block">
                  Upgrade to Enterprise
                </a>
                <p class="idle-note" style="color:#444">Exclusive to Enterprise plan · $99/mo</p>
              }
            } @else {
              <div class="idle-icon-wrap" [style.border-color]="modeColor()" [style.box-shadow]="'0 0 40px ' + modeColor() + '33'">
                <div class="idle-icon-inner" [style.color]="modeColor()">
                  @if (selectedMode() === '1v1') {
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M16.5 3.5l4 4-1.5 1.5-4-4M10 9l-7 7 1.5 1.5 7-7"/></svg>
                  } @else if (selectedMode() === '2v2') {
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  } @else {
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  }
                </div>
              </div>
              <h1 class="idle-title" [style.color]="modeColor()">{{ modeTitle() }}</h1>
              <div class="idle-tags">
                @if (selectedMode() === '1v1') {
                  <span class="tag" [style.border-color]="modeColor() + '44'" [style.color]="modeColor()">⚡ AI-generated</span>
                  <span class="tag" [style.border-color]="modeColor() + '44'" [style.color]="modeColor()">🔴 Real-time</span>
                  <span class="tag" [style.border-color]="modeColor() + '44'" [style.color]="modeColor()">🏆 1 round · winner takes all</span>
                  <span class="tag" [style.border-color]="modeColor() + '44'" [style.color]="modeColor()">📈 Ranked</span>
                } @else {
                  <span class="tag">⚡ AI-generated</span>
                  <span class="tag">🔴 Real-time</span>
                  <span class="tag">🔒 Coming soon</span>
                }
              </div>
              <button class="btn-find" [style.background]="modeColor()" (click)="handleModeAction()">
                {{ modeActionLabel() }}
              </button>
              @if (selectedMode() === '1v1') {
                <p class="idle-note">Your rating: <strong [style.color]="modeColor()">{{ authService.user()?.rating }}</strong> ELO</p>
              }

            }
          </div>
        </div>
      }

      <!-- ─── WAITING ───────────────────────────────────────────────── -->
      <!-- ─── MATCH FOUND ─────────────────────────────────────────────── -->
      @if (state() === 'match_found') {
        <div class="waiting-screen mf-screen">
          <om-silk class="waiting-silk"
            [color]="langColor()"
            [speed]="0.05"
            [scale]="1.8"
            [noiseIntensity]="3"
            [rotation]="20"
          ></om-silk>
          <div class="waiting-overlay mf-overlay"></div>

          <div class="mf-card">
            <!-- Header -->
            <div class="mf-header">
              <span class="mf-found-label" [style.color]="langColor()">Match Found</span>
              <div class="mf-chips-row">
                <span class="wm-chip-new" [style.color]="langColor()" [style.border-color]="langColor() + '55'" [style.background]="langColor() + '18'">
                  {{ langLabel(gameSetup.language()) }}
                </span>
                <span class="wm-sep">·</span>
                <span class="wm-chip-new wm-diff-{{ gameSetup.difficulty() }}">
                  {{ gameSetup.difficulty().charAt(0).toUpperCase() + gameSetup.difficulty().slice(1) }}
                </span>
              </div>
            </div>

            <!-- VS row -->
            <div class="mf-vs-row">
              <!-- Me -->
              <div class="mf-player">
                <div class="mf-avatar-wrap" [style.border-color]="langColor()">
                  <img [src]="authService.user()?.avatarUrl || 'https://github.com/ghost.png'"
                       class="mf-avatar" [alt]="authService.user()?.username" />
                </div>
                <span class="mf-username">{{ authService.user()?.username }}</span>
                <span class="mf-elo" [style.color]="langColor()">{{ authService.user()?.rating }} ELO</span>
              </div>

              <!-- VS -->
              <div class="mf-vs-col">
                <span class="mf-vs" [style.color]="langColor()" [style.text-shadow]="'0 0 32px ' + langColor() + 'aa'">VS</span>
              </div>

              <!-- Opponent -->
              <div class="mf-player">
                <div class="mf-avatar-wrap mf-avatar-opp">
                  <img [src]="foundOpponent()?.avatarUrl || 'https://github.com/ghost.png'"
                       class="mf-avatar" [alt]="foundOpponent()?.username" />
                </div>
                <span class="mf-username">{{ foundOpponent()?.username }}</span>
                <span class="mf-elo mf-elo-opp">{{ foundOpponent()?.rating }} ELO</span>
              </div>
            </div>

            <!-- Countdown / GO -->
            <div class="mf-countdown-row">
              @if (matchFoundGo()) {
                <span class="mf-go" [style.color]="langColor()" [style.text-shadow]="'0 0 40px ' + langColor()">GO!</span>
              } @else if (matchFoundCountdown() > 0) {
                <span class="mf-countdown-label">Starting in</span>
                <span class="mf-countdown" [style.color]="langColor()">{{ matchFoundCountdown() }}</span>
              } @else {
                <span class="mf-countdown-label mf-prep">Preparing challenge...</span>
              }
            </div>
          </div>
        </div>
      }

      @if (state() === 'waiting') {
        <div class="waiting-screen">

          <!-- Silk background — color del lenguaje elegido -->
          <om-silk class="waiting-silk"
            [color]="langColor()"
            [speed]="0.04"
            [scale]="1.8"
            [noiseIntensity]="3"
            [rotation]="15"
          ></om-silk>

          <!-- Overlay oscuro para contraste -->
          <div class="waiting-overlay"></div>

          <!-- Fragmentos de código flotantes -->
          <div class="code-float cf-1"><span class="cf-kw">const</span> solve = (arr) =&gt; arr.<span class="cf-fn">reduce</span>((a, b) =&gt; a + b, 0);</div>
          <div class="code-float cf-2"><span class="cf-kw">fn</span> <span class="cf-fn">main</span>() &#123; <span class="cf-kw">let</span> n = vec![1, 2, 3]; &#125;</div>
          <div class="code-float cf-3"><span class="cf-kw">def</span> <span class="cf-fn">solve</span>(nums: List[int]) -&gt; int:</div>
          <div class="code-float cf-4"><span class="cf-kw">func</span> <span class="cf-fn">twoSum</span>(nums []int, target int) []int &#123;</div>
          <div class="code-float cf-5">O(n log n) &nbsp;·&nbsp; space O(1)</div>
          <div class="code-float cf-6"><span class="cf-kw">for</span> (int i = 0; i &lt; n; i++) &#123; dp[i] = ...; &#125;</div>
          <div class="code-float cf-7"><span class="cf-kw">var</span> result []int = <span class="cf-fn">make</span>([]int, 0)</div>
          <div class="code-float cf-8">&#64;Override <span class="cf-kw">public</span> int <span class="cf-fn">solve</span>(int[] a)</div>

          <!-- Barra progreso top con color del lenguaje -->
          <div class="waiting-topbar" [style.background]="langColor()"></div>

          <!-- Card central -->
          <div class="waiting-card-new">

            <div class="vs-avatars">
              <!-- Yo -->
              <div class="vs-side">
                <div class="vs-avatar-wrap-new">
                  <div class="vs-ring-outer" [style.border-color]="langColor() + '55'"></div>
                  <div class="vs-ring-inner" [style.border-color]="langColor()"></div>
                  <img [src]="authService.user()?.avatarUrl || 'https://github.com/ghost.png'"
                       class="vs-avatar-img" [alt]="authService.user()?.username" />
                </div>
                <span class="vs-name">{{ authService.user()?.username }}</span>
                <span class="vs-elo-new" [style.color]="langColor()">{{ authService.user()?.rating }} ELO</span>
              </div>

              <!-- VS -->
              <div class="vs-center-col">
                <div class="vs-badge" [style.color]="langColor()" [style.text-shadow]="'0 0 24px ' + langColor() + '88'">VS</div>
              </div>

              <!-- Oponente -->
              <div class="vs-side">
                <div class="vs-avatar-wrap-new">
                  <div class="vs-ring-outer opp-ring-outer"></div>
                  <div class="vs-ring-inner opp-ring-inner"></div>
                  <div class="vs-unknown-img">?</div>
                </div>
                <span class="vs-name vs-name-muted">Searching<span class="ellipsis-anim">...</span></span>
                <span class="vs-elo-new vs-elo-muted">— ELO</span>
              </div>
            </div>

            <!-- Chips lenguaje + dificultad -->
            <div class="wm-chips">
              <span class="wm-chip-new" [style.color]="langColor()" [style.border-color]="langColor() + '55'" [style.background]="langColor() + '18'">
                {{ langLabel(gameSetup.language()) }}
              </span>
              <span class="wm-sep">·</span>
              <span class="wm-chip-new wm-diff-{{ gameSetup.difficulty() }}">
                {{ gameSetup.difficulty().charAt(0).toUpperCase() + gameSetup.difficulty().slice(1) }}
              </span>
            </div>

            <button class="btn-cancel-new" (click)="cancelQueue()">Cancel</button>
          </div>

        </div>
      }

      <!-- ─── GENERATING ────────────────────────────────────────────── -->
      @if (state() === 'generating') {
        <div class="screen">
          <div class="waiting-card">
            <div class="gen-icon">🤖</div>
            <h2 class="waiting-title">{{ currentRound() > 1 ? 'Round ' + currentRound() + '!' : 'Opponent found!' }}</h2>
            <p class="waiting-sub">AI is generating your challenge...</p>
            <div class="gen-bar"><div class="gen-fill" [style.background]="modeColor()"></div></div>
          </div>
        </div>
      }

      <!-- ─── ROUND RESULT ──────────────────────────────────────────── -->
      @if (state() === 'round_result') {
        <div class="screen">
          <div class="round-result-card">
            @if (lastRoundWon()) {
              <div class="rr-label won">Round Won</div>
            } @else if (lastRoundDraw()) {
              <div class="rr-label draw">Draw</div>
            } @else {
              <div class="rr-label lost">Round Lost</div>
            }
            <div class="rr-scores">
              <div class="rr-score me">
                <span class="rr-score-val" [style.color]="modeColor()">{{ myRoundWins() }}</span>
                <span class="rr-score-label">You</span>
              </div>
              <span class="rr-dash">—</span>
              <div class="rr-score opp">
                <span class="rr-score-val">{{ opponentRoundWins() }}</span>
                <span class="rr-score-label">Opponent</span>
              </div>
            </div>
            <p class="rr-next">Next round starting...</p>
          </div>
        </div>
      }

      <!-- ─── PLAYING / JUDGING ─────────────────────────────────────── -->
      @if (state() === 'playing' || state() === 'judging') {

        <!-- Challenge bar with expandable description -->
        @if (challenge()) {
          <div class="challenge-bar" [class.expanded]="descExpanded()">
            <span class="level-badge level-{{ challenge()!.level.toLowerCase() }}">{{ challenge()!.level }}</span>
            <span class="challenge-title">{{ challenge()!.title }}</span>
            <button class="desc-toggle" (click)="descExpanded.set(!descExpanded())">
              {{ descExpanded() ? '▲ Hide' : '▼ Description' }}
            </button>
            @if (descExpanded()) {
              <p class="challenge-full-desc">{{ challenge()!.description }}</p>
            }
          </div>
        }

        <div class="editors">
          <div class="editor-col">
            <div class="editor-header">
              <div class="editor-who me" [style.color]="modeColor()">
                <span class="who-dot" [style.background]="modeColor()"></span>
                <span>You</span>
              </div>
              <span class="lang-tag">{{ langLabel(language()) }}</span>
            </div>
            <div class="editor-wrap">
              <app-monaco-editor
                #myEditor
                language="javascript"
                [value]="starterCode"
                (valueChange)="onMyCodeChange($event)"
              />
            </div>
          </div>

          <div class="editor-col">
            <div class="editor-header">
              <div class="editor-who opp">
                <span class="who-dot"></span>
                <span>Opponent</span>
                @if (opponentSubmitted()) {
                  <span class="submitted-tag" [style.background]="'rgba(34,197,94,0.12)'" [style.color]="modeColor()">✓ Submitted</span>
                }
              </div>
              <span class="lang-tag">{{ langLabel(language()) }}</span>
            </div>
            <div class="editor-wrap opponent-wrap">
              <app-monaco-editor
                #opponentEditor
                language="javascript"
                [value]="opponentCode()"
                [readOnly]="true"
              />
              <div class="opponent-overlay">
                <span class="overlay-msg">What are you looking at? 👀</span>
              </div>
            </div>
          </div>
        </div>

        <div class="play-footer">
          <span class="footer-match">Match · {{ matchId().slice(0,8) }}</span>
          @if (state() === 'judging') {
            <div class="judging-row">
              <div class="spinner" [style.border-top-color]="modeColor()"></div>
              <span class="judging-text">Running tests...</span>
            </div>
          } @else {
            <div class="submit-row">
              <span class="shortcut-hint">Ctrl+Enter</span>
              <button class="btn-submit" [style.background]="modeColor()" (click)="submitCode()">Submit Solution →</button>
            </div>
          }
        </div>
      }

      <!-- ─── FINISHED / POST-MATCH ────────────────────────────────── -->
      @if (state() === 'finished') {
        <div class="postmatch-scroll">
          <div class="postmatch">

            <!-- Section 1: Hero result -->
            <div class="pm-hero">
              @if (isWinner()) {
                <div class="pm-result-badge win">Victory</div>
                <div class="pm-elo-delta win">+{{ finishedData()?.eloChange ?? 25 }} ELO</div>
              } @else if (isDraw()) {
                <div class="pm-result-badge draw">Draw</div>
                <div class="pm-elo-delta draw">±0 ELO</div>
              } @else {
                <div class="pm-result-badge loss">Defeat</div>
                <div class="pm-elo-delta loss">−{{ finishedData()?.eloChange ?? 25 }} ELO</div>
              }
              <div class="pm-new-elo">{{ authService.user()?.rating }} ELO total</div>
              <div class="pm-rounds-summary">
                <span class="pm-rs-you">{{ myRoundWins() }}</span>
                <span class="pm-rs-sep">—</span>
                <span class="pm-rs-opp">{{ opponentRoundWins() }}</span>
              </div>
            </div>

            <!-- Section 2: Round breakdown -->
            @if (finishedData()?.rounds?.length) {
              <div class="pm-breakdown">
                <h3 class="pm-section-title">Round Breakdown</h3>

                <!-- Tabs -->
                <div class="pm-tabs">
                  @for (r of finishedData()!.rounds; track r.roundNumber) {
                    <button
                      class="pm-tab"
                      [class.active]="activeRoundTab() === $index"
                      (click)="activeRoundTab.set($index)"
                    >
                      Round {{ r.roundNumber }}
                      @if (r.winnerId === authService.user()?.id) {
                        <span class="tab-badge win">W</span>
                      } @else if (r.winnerId && r.winnerId !== authService.user()?.id) {
                        <span class="tab-badge loss">L</span>
                      } @else {
                        <span class="tab-badge draw">D</span>
                      }
                    </button>
                  }
                </div>

                <!-- Active round detail -->
                @if (finishedData(); as fd) {
                  @if (fd.rounds[activeRoundTab()]; as activeRound) {
                    <div class="pm-round-detail">
                      <div class="pm-round-header">
                        <span class="pm-round-challenge">{{ activeRound.challengeTitle }}</span>
                      </div>
                      <div class="pm-code-cols">
                        <div class="pm-code-col">
                          <div class="pm-code-label">Your code</div>
                          <pre class="pm-code-block">{{ fd.player1Id === authService.user()?.id ? activeRound.p1Code : activeRound.p2Code }}</pre>
                          <div class="pm-code-time">{{ formatTime(fd.player1Id === authService.user()?.id ? activeRound.p1Time : activeRound.p2Time) }}</div>
                        </div>
                        <div class="pm-code-col">
                          <div class="pm-code-label">Opponent's code</div>
                          <pre class="pm-code-block">{{ fd.player1Id === authService.user()?.id ? activeRound.p2Code : activeRound.p1Code }}</pre>
                          <div class="pm-code-time">{{ formatTime(fd.player1Id === authService.user()?.id ? activeRound.p2Time : activeRound.p1Time) }}</div>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>
            }

            <!-- Section 3: Actions -->
            <div class="pm-actions">
              <button class="pm-btn-primary" [style.background]="modeColor()" (click)="playAgain()">
                Play Again
              </button>
              <a routerLink="/profile" class="pm-btn-secondary">View Profile</a>
              <button class="pm-btn-share" (click)="showShareModal.set(true)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
              </button>
              @if (authService.user()?.tier === 'ENTERPRISE' && roomCode()) {
                <button class="pm-btn-share" (click)="exportReport()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Export Report
                </button>
              }
              <a routerLink="/dashboard" class="pm-btn-ghost">Dashboard</a>
            </div>

          </div>
        </div>
      }

      <!-- ─── Share modal ───────────────────────────────────────────── -->
      @if (showShareModal()) {
        <div class="share-backdrop" (click)="showShareModal.set(false)">
          <div class="share-modal" (click)="$event.stopPropagation()">
            <button class="share-close" (click)="showShareModal.set(false)">✕</button>
            <h3 class="share-title">Share your result</h3>

            <!-- Visual card (what gets rendered to image) -->
            <div class="share-card" #shareCard>
              <div class="sc-logo">⚡ MatchMood</div>
              <div class="sc-vs">
                <span class="sc-user">&#64;{{ authService.user()?.username }}</span>
                <span class="sc-sep">vs</span>
                <span class="sc-opp">opponent</span>
              </div>
              @if (finishedData()?.rounds?.[0]?.challengeTitle) {
                <div class="sc-challenge">{{ finishedData()!.rounds[0].challengeTitle }}</div>
              }
              <div class="sc-result-row">
                @if (isWinner()) {
                  <span class="sc-badge sc-win">WIN</span>
                  <span class="sc-elo sc-elo-pos">ELO +{{ finishedData()?.eloChange ?? 25 }}</span>
                } @else if (isDraw()) {
                  <span class="sc-badge sc-draw">DRAW</span>
                  <span class="sc-elo">ELO ±0</span>
                } @else {
                  <span class="sc-badge sc-loss">LOSS</span>
                  <span class="sc-elo sc-elo-neg">ELO −{{ finishedData()?.eloChange ?? 25 }}</span>
                }
                <span class="sc-new-elo">{{ authService.user()?.rating }} total</span>
              </div>
              <div class="sc-url">matchmood.app/u/{{ authService.user()?.username }}</div>
            </div>

            <!-- Action buttons -->
            <div class="share-actions">
              <button class="share-btn share-btn-img" (click)="copyImage()" [class.copied]="imageCopied()">
                @if (imageCopied()) { ✓ Copied! } @else { Copy image }
              </button>
              <button class="share-btn share-btn-link" (click)="copyLink()" [class.copied]="linkCopied()">
                @if (linkCopied()) { ✓ Copied! } @else { Copy link }
              </button>
            </div>
          </div>
        </div>
      }


    </div>
  `,
  styles: [`
    .arena { display: flex; flex-direction: column; flex: 1; min-height: 0; background: #080808; color: #f0f0f0; font-family: 'Inter', -apple-system, sans-serif; overflow: hidden; position: relative; }
    .arena-aurora { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.18; filter: hue-rotate(90deg) brightness(0.6) saturate(1.4); }
    .arena-aurora ~ * { position: relative; z-index: 1; }

    /* ── Topbar ────────────────────────────────────────────────────── */
    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(8,8,8,0.95); flex-shrink: 0; }
    .topbar-left { display: flex; align-items: center; }
    .topbar-logo { display: flex; align-items: center; gap: 10px; }
    .topbar-logo-icon {
      width: 30px; height: 30px; border-radius: 8px; border: 1px solid;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04); transition: all .3s;
    }
    .topbar-logo-text { font-size: 14px; font-weight: 800; letter-spacing: -0.3px; transition: color .3s; }
    .topbar-right { display: flex; align-items: center; gap: 12px; }
    .top-elo-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 8px; border: 1px solid;
      transition: border-color .3s, background .3s; cursor: pointer;
    }
    .top-elo-chip:hover { opacity: 0.8; }
    .tec-icon  { font-size: 14px; line-height: 1; }
    .tec-label { font-size: 12px; font-weight: 800; letter-spacing: -0.2px; }
    .tec-sep   { font-size: 11px; color: rgba(255,255,255,0.2); }
    .tec-elo   { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.55); }

    /* Round indicator — line segments */
    .round-indicator { display: flex; align-items: center; gap: 8px; }
    .round-dot { width: 28px; height: 3px; border-radius: 2px; background: var(--border-bright, #2a2a2a); transition: background 300ms ease; }
    .round-dot.won { background: var(--green, #22c55e); }
    .round-dot.lost { background: var(--red, #ef4444); }
    .round-dot.current { background: var(--border-bright, #2a2a2a); animation: pulse-green 1.5s ease infinite; }
    .round-label { font-size: 11px; color: var(--text-muted, #52525b); margin-left: 4px; font-weight: 600; letter-spacing: 0.05em; }

    /* ── Challenge Modal ───────────────────────────────────────────── */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn .2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .challenge-modal { background: #0f0f0f; border: 1px solid #222; border-radius: 16px; padding: 32px; max-width: 560px; width: 100%; position: relative; animation: slideUp .25s ease; }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #444; font-size: 16px; cursor: pointer; transition: color .15s; }
    .modal-close:hover { color: #888; }
    .modal-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .modal-round { font-size: 11px; color: #333; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .modal-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 12px; color: #f0f0f0; }
    .modal-desc { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 20px; }
    .modal-meta { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 10px; padding: 14px 16px; }
    .meta-item { display: flex; gap: 12px; align-items: baseline; }
    .meta-label { font-size: 11px; font-weight: 700; color: #333; text-transform: uppercase; letter-spacing: 1px; width: 72px; flex-shrink: 0; }
    .meta-val { font-size: 13px; color: #888; }
    .modal-footer { display: flex; flex-direction: column; gap: 10px; }
    .countdown-bar { height: 3px; background: #1a1a1a; border-radius: 2px; overflow: hidden; }
    .countdown-fill { height: 100%; background: #22c55e; border-radius: 2px; transition: width 1s linear; }
    .countdown-text { font-size: 11px; color: #333; text-align: right; }
    .modal-start-btn { background: #22c55e; color: #000; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 800; cursor: pointer; transition: background .15s; }
    .modal-start-btn:hover { background: #16a34a; }

    /* ── Level badges ──────────────────────────────────────────────── */
    .level-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 4px; flex-shrink: 0; }
    .level-easy { background: rgba(34,197,94,0.15); color: #22c55e; }
    .level-medium { background: rgba(234,179,8,0.15); color: #eab308; }
    .level-hard { background: rgba(244,63,94,0.15); color: #f43f5e; }
    .modal-level { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 4px; }

    /* ── Mode mini-navbar ──────────────────────────────────────────── */
    .mode-navbar { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; background: rgba(8,8,8,0.6); }
    .mode-tab {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.35); padding: 8px 18px; border-radius: 9px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: border-color .2s, color .2s, background .2s, box-shadow .2s;
      display: flex; align-items: center; gap: 8px; white-space: nowrap;
    }
    .mode-tab:hover { border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.05); }
    .mode-tab.active {
      border-color: var(--mode-color, #22c55e);
      color: var(--mode-color, #22c55e);
      background: color-mix(in srgb, var(--mode-color, #22c55e) 10%, transparent);
      box-shadow: 0 0 16px color-mix(in srgb, var(--mode-color, #22c55e) 20%, transparent);
    }
    .tab-icon { display: flex; align-items: center; }
    .tab-soon { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.25); padding: 2px 6px; border-radius: 4px; }
    .tab-enterprise { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: rgba(16,185,129,0.12); color: #10b981; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.2); }

    /* ── Screens ───────────────────────────────────────────────────── */
    .screen { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; overflow: hidden; }
    .screen-idle {
      background:
        radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--mode-color) 12%, transparent) 0%, transparent 60%),
        radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--mode-color) 5%, transparent) 0%, transparent 70%);
      transition: background .4s;
    }

    /* ── Idle card ─────────────────────────────────────────────────── */
    .idle-card { display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; max-width: 500px; position: relative; z-index: 1; }

    .idle-icon-wrap {
      width: 88px; height: 88px; border-radius: 24px; border: 1px solid;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.03); transition: all .3s;
      position: relative;
    }
    .idle-icon-wrap::before {
      content: ''; position: absolute; inset: -1px; border-radius: 24px;
      background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 60%);
      pointer-events: none;
    }
    .idle-icon-inner { display: flex; align-items: center; justify-content: center; transition: color .3s; }

    .idle-title { font-size: 42px; font-weight: 900; letter-spacing: -2px; margin: 0; transition: color .3s; color: #fff; }
    .idle-desc { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.6; margin: 0; max-width: 380px; }
    .idle-tags { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .tag {
      font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
      padding: 5px 13px; border-radius: 999px;
      background: rgba(255,255,255,0.04); border: 1px solid;
      transition: all .2s;
    }
    .btn-find {
      color: #000; border: none; padding: 0 48px; height: 56px;
      border-radius: 12px; font-size: 16px; font-weight: 900;
      cursor: pointer; transition: filter .15s, transform .1s, box-shadow .15s;
      margin-top: 4px; letter-spacing: 0.02em;
    }
    .btn-find:hover:not(:disabled) { filter: brightness(0.9); transform: translateY(-2px); }
    .btn-find:disabled { opacity: 0.4; cursor: not-allowed; }
    @keyframes readyPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4), 0 8px 32px rgba(34,197,94,0.2); }
      50%       { box-shadow: 0 0 0 10px rgba(34,197,94,0), 0 8px 32px rgba(34,197,94,0.3); }
    }
    .btn-find:not(:disabled) { animation: readyPulse 2.5s ease-in-out infinite; }
    .idle-note { font-size: 13px; color: rgba(255,255,255,0.35); margin: 0; }

    /* ── Waiting screen ────────────────────────────────────────────── */
    .waiting-screen {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      overflow: hidden; z-index: 2;
    }
    .waiting-silk { position: absolute; inset: 0; width: 100%; height: 100%; }
    .waiting-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.55);
    }
    .waiting-topbar {
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      opacity: 0.8; animation: shimmer 2s linear infinite;
      background-size: 200% 100%;
    }

    /* ── Floating code fragments ──────────────────────────────────── */
    .code-float {
      position: absolute; font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 11px; color: rgba(255,255,255,0.12); white-space: nowrap;
      pointer-events: none; user-select: none;
      animation: cfloat 7s ease-in-out infinite;
    }
    .cf-kw { color: rgba(139,92,246,0.5); }
    .cf-fn { color: rgba(34,197,94,0.45); }

    .cf-1 { top: 12%; left: 5%;  animation-delay: 0s;    animation-duration: 9s;  }
    .cf-2 { top: 20%; right: 6%; animation-delay: 1.2s;  animation-duration: 11s; }
    .cf-3 { top: 38%; left: 3%;  animation-delay: 2.5s;  animation-duration: 8s;  }
    .cf-4 { top: 62%; left: 7%;  animation-delay: 0.7s;  animation-duration: 10s; }
    .cf-5 { top: 75%; right: 4%; animation-delay: 3.1s;  animation-duration: 12s; }
    .cf-6 { top: 55%; right: 5%; animation-delay: 1.8s;  animation-duration: 9s;  }
    .cf-7 { top: 85%; left: 10%; animation-delay: 4s;    animation-duration: 11s; }
    .cf-8 { top: 30%; right: 8%; animation-delay: 2s;    animation-duration: 8s;  }

    @keyframes cfloat {
      0%   { opacity: 0;    transform: translateY(8px);  }
      15%  { opacity: 1; }
      85%  { opacity: 1; }
      100% { opacity: 0;    transform: translateY(-8px); }
    }

    /* ── VS Card ──────────────────────────────────────────────────── */
    .waiting-card-new {
      position: relative; z-index: 10;
      display: flex; flex-direction: column; align-items: center; gap: 32px;
      background: rgba(6,6,6,0.7); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 28px; padding: 52px 72px 44px;
      backdrop-filter: blur(24px);
      box-shadow: 0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset;
      animation: cardIn 400ms cubic-bezier(.22,1,.36,1) both;
      min-width: 480px;
    }
    @keyframes cardIn { from{opacity:0;transform:scale(.94) translateY(20px)} to{opacity:1;transform:none} }

    .vs-avatars { display: flex; align-items: center; gap: 56px; }
    .vs-side { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .vs-center-col { display: flex; align-items: center; }
    .vs-badge {
      font-size: 26px; font-weight: 900; letter-spacing: 6px;
      text-shadow: 0 0 40px currentColor;
    }

    .vs-avatar-wrap-new {
      position: relative; width: 100px; height: 100px;
      display: flex; align-items: center; justify-content: center;
    }
    .vs-ring-outer {
      position: absolute; inset: -8px; border-radius: 50%;
      border: 1px solid; opacity: 0.3; animation: ringPulseOuter 2.5s ease-in-out infinite;
    }
    .vs-ring-inner {
      position: absolute; inset: -3px; border-radius: 50%;
      border: 2px solid; animation: ringPulseInner 2.5s ease-in-out infinite;
    }
    @keyframes ringPulseOuter { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.5;transform:scale(1.05)} }
    @keyframes ringPulseInner { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.02)} }

    .opp-ring-outer { border-color: rgba(255,255,255,0.15) !important; animation: oppPulse 1.8s ease-in-out infinite; }
    .opp-ring-inner { border-color: rgba(255,255,255,0.25) !important; animation: oppPulse 1.8s ease-in-out infinite .3s; }
    @keyframes oppPulse { 0%,100%{opacity:.3} 50%{opacity:.8} }

    .vs-avatar-img {
      width: 100px; height: 100px; border-radius: 50%; object-fit: cover;
      position: relative; z-index: 1;
      border: 2px solid rgba(255,255,255,0.12);
    }
    .vs-unknown-img {
      width: 100px; height: 100px; border-radius: 50%;
      background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; font-weight: 900; color: rgba(255,255,255,0.2);
      position: relative; z-index: 1;
      animation: unknownPulse 1.8s ease-in-out infinite;
    }
    @keyframes unknownPulse { 0%,100%{color:rgba(255,255,255,0.15)} 50%{color:rgba(255,255,255,0.35)} }

    .vs-name { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.8); letter-spacing: -0.2px; }
    .vs-name-muted { color: rgba(255,255,255,0.3); }
    .vs-elo-new { font-size: 13px; font-weight: 800; }
    .vs-elo-muted { color: rgba(255,255,255,0.2); }

    /* Ellipsis */
    .ellipsis-anim { display: inline-block; }

    /* Chips */
    .wm-chips { display: flex; align-items: center; gap: 8px; }
    .wm-chip-new {
      font-size: 11px; font-weight: 700; padding: 4px 12px;
      border-radius: 999px; border: 1px solid;
    }
    .wm-sep { font-size: 11px; color: rgba(255,255,255,0.2); }
    .wm-diff-easy   { background: rgba(34,197,94,0.12);  color: #22c55e; border-color: rgba(34,197,94,0.3);  }
    .wm-diff-medium { background: rgba(251,191,36,0.12); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
    .wm-diff-hard   { background: rgba(244,63,94,0.12);  color: #f43f5e; border-color: rgba(244,63,94,0.3);  }

    .btn-cancel-new {
      background: rgba(244,63,94,0.08);
      border: 1px solid rgba(244,63,94,0.25);
      border-radius: 20px;
      padding: 7px 20px;
      font-size: 12px;
      font-weight: 600;
      color: rgba(244,63,94,0.7);
      cursor: pointer;
      letter-spacing: 0.03em;
      transition: background 150ms, border-color 150ms, color 150ms;
      display: flex; align-items: center; gap: 6px;
    }
    .btn-cancel-new::before {
      content: '✕';
      font-size: 10px;
    }
    .btn-cancel-new:hover {
      background: rgba(244,63,94,0.15);
      border-color: rgba(244,63,94,0.5);
      color: #f43f5e;
    }
    .btn-cancel-new:active { transform: scale(0.97); }

    /* ── Match Found screen ──────────────────────────────────────────── */
    .mf-screen { z-index: 200; }
    .mf-overlay { background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }

    .mf-card {
      position: relative; z-index: 10;
      background: rgba(10,10,10,0.82);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 36px 56px 32px;
      display: flex; flex-direction: column; align-items: center; gap: 28px;
      min-width: 520px;
      backdrop-filter: blur(20px);
      box-shadow: 0 0 80px rgba(0,0,0,0.6);
      animation: mfIn 350ms cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes mfIn {
      from { opacity: 0; transform: scale(0.88) translateY(16px); }
      to   { opacity: 1; transform: none; }
    }

    .mf-header { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .mf-found-label {
      font-size: 13px; font-weight: 800; letter-spacing: 0.18em;
      text-transform: uppercase;
      animation: mfPulse 1.4s ease-in-out infinite;
    }
    @keyframes mfPulse {
      0%,100% { opacity: 1; } 50% { opacity: 0.55; }
    }
    .mf-chips-row { display: flex; align-items: center; gap: 6px; }

    .mf-vs-row {
      display: flex; align-items: center; gap: 32px;
    }
    .mf-player { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 140px; }

    .mf-avatar-wrap {
      width: 88px; height: 88px; border-radius: 50%;
      border: 2.5px solid; padding: 3px;
      animation: mfAvatarIn 400ms cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .mf-avatar-wrap.mf-avatar-opp {
      border-color: rgba(255,255,255,0.2);
      animation-delay: 80ms;
    }
    @keyframes mfAvatarIn {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: none; }
    }
    .mf-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }

    .mf-username {
      font-size: 14px; font-weight: 700; color: #fff;
      max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center;
    }
    .mf-elo { font-size: 12px; font-weight: 600; }
    .mf-elo-opp { color: rgba(255,255,255,0.35); }

    .mf-vs-col { display: flex; flex-direction: column; align-items: center; }
    .mf-vs {
      font-size: 40px; font-weight: 900; letter-spacing: -1px;
      animation: mfVsPulse 1.6s ease-in-out infinite;
    }
    @keyframes mfVsPulse {
      0%,100% { transform: scale(1);    }
      50%      { transform: scale(1.08); }
    }

    .mf-countdown-row {
      display: flex; align-items: center; gap: 10px;
    }
    .mf-countdown-label { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 500; }
    .mf-countdown {
      font-size: 32px; font-weight: 900; line-height: 1;
      animation: mfCountAnim 1s ease-in-out infinite;
    }
    @keyframes mfCountAnim {
      0%  { transform: scale(1.2); opacity: 0.6; }
      30% { transform: scale(1);   opacity: 1;   }
      100%{ transform: scale(1);   opacity: 1;   }
    }
    .mf-prep { font-style: italic; }

    .mf-go {
      font-size: 52px; font-weight: 900; letter-spacing: -1px; line-height: 1;
      animation: mfGo 700ms cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes mfGo {
      0%   { opacity: 0; transform: scale(0.4); }
      60%  { opacity: 1; transform: scale(1.15); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* Legacy waiting-card for generating screen */
    .waiting-card { display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; }
    .wm-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.2); }
    .btn-cancel-text { background: none; border: none; color: var(--text-muted, #52525b); font-size: 13px; cursor: pointer; transition: color .15s; text-decoration: underline; text-underline-offset: 3px; margin-top: 4px; }
    .btn-cancel-text:hover { color: var(--text-secondary, #a1a1aa); }
    .btn-cancel { background: none; border: 1px solid var(--border, #1f1f1f); color: var(--text-muted, #52525b); padding: 8px 24px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: border-color .15s, color .15s; margin-top: 8px; }
    .btn-cancel:hover { border-color: var(--border-bright, #2a2a2a); color: var(--text-secondary, #a1a1aa); }
    .gen-icon { font-size: 40px; margin-bottom: 4px; }
    .gen-bar { width: 200px; height: 3px; background: #111; border-radius: 2px; overflow: hidden; margin-top: 8px; }
    .gen-fill { height: 100%; width: 60%; border-radius: 2px; animation: slide 1.5s ease-in-out infinite; }
    @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(280%); } }

    /* ── Round result ──────────────────────────────────────────────── */
    .round-result-card { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; animation: rrEnter .3s ease; }
    @keyframes rrEnter { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
    .rr-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
    .rr-label.won  { color: var(--green, #22c55e); }
    .rr-label.draw { color: var(--text-secondary, #a1a1aa); }
    .rr-label.lost { color: var(--red, #ef4444); }
    .rr-scores { display: flex; align-items: center; gap: 20px; }
    .rr-score { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .rr-score-val { font-size: 64px; font-weight: 800; letter-spacing: -3px; line-height: 1; }
    .rr-score.me  .rr-score-val { color: var(--green, #22c55e); }
    .rr-score.opp .rr-score-val { color: var(--text-secondary, #a1a1aa); }
    .rr-score-label { font-size: 11px; color: var(--text-muted, #52525b); text-transform: uppercase; letter-spacing: 0.1em; }
    .rr-dash { font-size: 32px; color: var(--text-muted, #52525b); }
    .rr-next { font-size: 13px; color: var(--text-muted, #52525b); }

    /* ── Challenge bar ─────────────────────────────────────────────── */
    .challenge-bar { display: flex; align-items: center; gap: 12px; padding: 9px 20px; background: var(--bg-surface, #0d0d0d); border-bottom: 1px solid var(--border, #1f1f1f); flex-shrink: 0; flex-wrap: wrap; }
    .challenge-bar.expanded { padding-bottom: 14px; }
    .challenge-title { font-size: 13px; font-weight: 600; color: var(--text-primary, #fff); flex-shrink: 0; }
    .desc-toggle { background: none; border: 1px solid var(--border, #1f1f1f); color: var(--text-muted, #52525b); padding: 3px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-left: auto; transition: border-color .15s, color .15s; flex-shrink: 0; }
    .desc-toggle:hover { border-color: var(--border-bright, #2a2a2a); color: var(--text-secondary, #a1a1aa); }
    .challenge-full-desc { width: 100%; font-size: 13px; color: var(--text-muted, #52525b); line-height: 1.6; margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--border, #1f1f1f); }

    /* ── Editors ───────────────────────────────────────────────────── */
    .editors { display: flex; flex: 1; gap: 1px; background: #111; overflow: hidden; min-height: 0; }
    .editor-col { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: #0a0a0a; border-bottom: 1px solid #161616; flex-shrink: 0; }
    .editor-who { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; }
    .who-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .editor-who.opp { color: #a1a1aa; }
    .editor-who.opp .who-dot { background: #a1a1aa; }
    .submitted-tag { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .lang-tag { font-size: 10px; font-weight: 700; color: #2a2a2a; text-transform: uppercase; letter-spacing: 1px; }
    .editor-wrap { flex: 1; overflow: hidden; min-height: 0; }
    .opponent-wrap { position: relative; }
    .opponent-wrap app-monaco-editor { pointer-events: none; user-select: none; }
    .opponent-overlay { position: absolute; inset: 0; pointer-events: all; z-index: 10; cursor: not-allowed; }
    .overlay-msg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.85); color: #fff; padding: 8px 18px; border-radius: 8px; font-size: 14px; opacity: 0; transition: opacity 0.2s; white-space: nowrap; pointer-events: none; border: 1px solid #333; }
    .opponent-wrap:hover .overlay-msg { opacity: 1; }

    /* ── Play footer ───────────────────────────────────────────────── */
    .play-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: var(--bg-surface, #0d0d0d); border-top: 1px solid var(--border, #1f1f1f); flex-shrink: 0; }
    .footer-match { font-size: 11px; color: var(--text-muted, #52525b); font-family: monospace; }
    .judging-row { display: flex; align-items: center; gap: 10px; }
    .judging-text { font-size: 13px; color: var(--amber, #f59e0b); font-weight: 600; }
    .spinner { width: 16px; height: 16px; border: 2px solid var(--border-bright, #2a2a2a); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .submit-row { display: flex; align-items: center; gap: 12px; }
    .shortcut-hint { font-size: 11px; color: var(--text-muted, #52525b); font-family: monospace; }
    .btn-submit { color: #000; border: none; padding: 10px 28px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; transition: filter .15s, transform .1s; }
    .btn-submit:hover { filter: brightness(0.88); transform: translateY(-1px); }

    /* ── Disconnect banner ────────────────────────────────────────── */
    .disconnect-banner { background: rgba(251,146,60,0.12); border-bottom: 1px solid rgba(251,146,60,0.25); padding: 8px 24px; font-size: 13px; color: #fb923c; text-align: center; flex-shrink: 0; }

    /* ── Private room UI ──────────────────────────────────────────── */
    .private-room-ui { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 380px; }
    .room-section { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; }
    .room-code-display { display: flex; align-items: center; gap: 10px; background: #111; border: 1px solid #2a2a2a; border-radius: 10px; padding: 12px 16px; width: 100%; box-sizing: border-box; }
    .room-code-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
    .room-code { font-size: 22px; font-weight: 900; letter-spacing: 4px; color: #10b981; font-family: monospace; flex: 1; text-align: center; }
    .room-code-copy { background: #1a1a1a; border: 1px solid #2a2a2a; color: #888; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all .15s; }
    .room-code-copy:hover { border-color: #444; color: #fff; }
    .room-note { font-size: 12px; color: #444; margin: 0; text-align: center; }
    .room-divider { font-size: 12px; color: #333; text-transform: uppercase; letter-spacing: 2px; }
    .room-join-row { display: flex; gap: 8px; width: 100%; }
    .room-input { flex: 1; background: #111; border: 1px solid #222; border-radius: 8px; padding: 11px 14px; font-size: 15px; color: #fff; outline: none; font-family: monospace; letter-spacing: 2px; text-transform: uppercase; transition: border-color .15s; }
    .room-input:focus { border-color: #10b981; }
    .btn-join-room { border: none; color: #000; font-weight: 700; padding: 11px 18px; border-radius: 8px; font-size: 14px; cursor: pointer; white-space: nowrap; transition: filter .18s; }
    .btn-join-room:hover { filter: brightness(.88); }
    .room-error { font-size: 12px; color: #f43f5e; }

    /* ── Mobile responsive ────────────────────────────────────────── */
    @media (max-width: 768px) {
      .editors-split { flex-direction: column; }
      .editor-pane { min-height: 240px; }
      .editor-pane:first-child { border-right: none; border-bottom: 1px solid #161616; }
      .topbar { padding: 8px 12px; }
      .top-user, .top-elo { display: none; }
    }

    /* ── Post-match screen ────────────────────────────────────────── */
    .postmatch-scroll { flex: 1; overflow-y: auto; }
    .postmatch { max-width: 860px; margin: 0 auto; padding: 40px 24px 60px; display: flex; flex-direction: column; gap: 32px; }

    /* Hero */
    .pm-hero { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; animation: slideUp .35s ease; }
    .pm-result-badge { font-size: 48px; font-weight: 900; letter-spacing: -2px; line-height: 1; text-transform: uppercase; }
    .pm-result-badge.win  { color: var(--green, #22c55e); }
    .pm-result-badge.draw { color: var(--text-secondary, #a1a1aa); }
    .pm-result-badge.loss { color: var(--red, #ef4444); }
    .pm-elo-delta { font-size: 22px; font-weight: 800; padding: 6px 22px; border-radius: 10px; }
    .pm-elo-delta.win  { background: var(--green-glow, rgba(34,197,94,0.12)); color: var(--green, #22c55e); }
    .pm-elo-delta.draw { background: var(--bg-elevated, #141414); color: var(--text-secondary, #a1a1aa); }
    .pm-elo-delta.loss { background: rgba(239,68,68,0.12); color: var(--red, #ef4444); }
    .pm-new-elo { font-size: 13px; color: var(--text-muted, #52525b); }
    .pm-rounds-summary { display: flex; align-items: center; gap: 16px; margin-top: 4px; }
    .pm-rs-you { font-size: 36px; font-weight: 900; color: var(--green, #22c55e); }
    .pm-rs-opp { font-size: 36px; font-weight: 900; color: var(--text-secondary, #a1a1aa); }
    .pm-rs-sep { font-size: 24px; color: var(--text-muted, #52525b); }

    /* Breakdown */
    .pm-breakdown { background: var(--bg-surface, #0d0d0d); border: 1px solid var(--border, #1f1f1f); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 20px; animation: slideUp .4s ease; }
    .pm-section-title { font-size: 11px; font-weight: 700; color: var(--text-muted, #52525b); text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
    .pm-tabs { display: flex; gap: 8px; }
    .pm-tab { background: transparent; border: 1px solid var(--border, #1f1f1f); color: var(--text-muted, #52525b); border-radius: 8px; padding: 6px 14px; font-size: 13px; cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 6px; }
    .pm-tab:hover { border-color: var(--border-bright, #2a2a2a); color: var(--text-secondary, #a1a1aa); }
    .pm-tab.active { background: var(--bg-elevated, #141414); border-color: var(--border-bright, #2a2a2a); color: var(--text-primary, #fff); }
    .tab-badge { font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 4px; }
    .tab-badge.win  { background: var(--green-glow, rgba(34,197,94,0.2)); color: var(--green, #22c55e); }
    .tab-badge.loss { background: rgba(239,68,68,0.15); color: var(--red, #ef4444); }
    .tab-badge.draw { background: var(--bg-elevated, #141414); color: var(--text-muted, #52525b); }
    .pm-round-detail { display: flex; flex-direction: column; gap: 12px; }
    .pm-round-header { display: flex; justify-content: space-between; align-items: center; }
    .pm-round-challenge { font-size: 14px; font-weight: 600; color: var(--text-secondary, #a1a1aa); }
    .pm-code-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .pm-code-col { display: flex; flex-direction: column; gap: 6px; }
    .pm-code-label { font-size: 11px; font-weight: 600; color: var(--text-muted, #52525b); text-transform: uppercase; letter-spacing: 0.08em; }
    .pm-code-block { background: var(--bg-base, #000); border: 1px solid var(--border, #1f1f1f); border-radius: 8px; padding: 12px; font-size: 12px; font-family: 'JetBrains Mono', monospace; color: var(--text-secondary, #a1a1aa); overflow-x: auto; white-space: pre; margin: 0; max-height: 220px; overflow-y: auto; }
    .pm-code-time { font-size: 11px; color: var(--text-muted, #52525b); }

    /* Actions */
    .pm-actions { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
    .pm-btn-primary { border: none; color: #000; font-weight: 700; padding: 13px 28px; border-radius: 10px; font-size: 15px; cursor: pointer; transition: filter .18s, transform 100ms ease; }
    .pm-btn-primary:hover { filter: brightness(.88); }
    .pm-btn-primary:active { transform: scale(0.98); }
    .pm-btn-secondary { background: var(--bg-elevated, #141414); color: var(--text-secondary, #a1a1aa); text-decoration: none; padding: 13px 24px; border-radius: 10px; font-size: 15px; font-weight: 600; border: 1px solid var(--border, #1f1f1f); transition: border-color .15s; }
    .pm-btn-secondary:hover { border-color: var(--border-bright, #2a2a2a); }
    .pm-btn-share { background: transparent; border: 1px solid var(--border-bright, #2a2a2a); color: var(--text-secondary, #a1a1aa); border-radius: 10px; padding: 12px 18px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: border-color .15s, color .15s; }
    .pm-btn-share:hover { border-color: var(--green, #22c55e); color: var(--green, #22c55e); }
    .pm-btn-ghost { color: var(--text-muted, #52525b); text-decoration: none; padding: 13px 16px; font-size: 13px; transition: color .15s; }
    .pm-btn-ghost:hover { color: var(--text-secondary, #a1a1aa); }

    /* ── Share modal ───────────────────────────────────────────────── */
    .share-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn .2s ease; }
    .share-modal { background: var(--bg-surface, #0d0d0d); border: 1px solid var(--border-bright, #2a2a2a); border-radius: 16px; padding: 32px; width: 100%; max-width: 400px; position: relative; animation: slideUp .25s ease; display: flex; flex-direction: column; gap: 24px; }
    .share-close { position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: var(--text-muted, #52525b); font-size: 16px; cursor: pointer; transition: color .15s; line-height: 1; padding: 4px; }
    .share-close:hover { color: var(--text-secondary, #a1a1aa); }
    .share-title { font-size: 16px; font-weight: 700; color: var(--text-primary, #fff); margin: 0; }

    /* Visual share card */
    .share-card { background: var(--bg-elevated, #141414); border: 1px solid var(--border, #1f1f1f); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .sc-logo { font-size: 12px; font-weight: 800; color: var(--text-muted, #52525b); letter-spacing: .5px; }
    .sc-vs { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; }
    .sc-user { color: var(--text-primary, #fff); }
    .sc-sep { color: var(--text-muted, #52525b); font-size: 13px; }
    .sc-opp { color: var(--text-muted, #52525b); }
    .sc-challenge { font-size: 12px; color: var(--text-muted, #52525b); line-height: 1.4; }
    .sc-result-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
    .sc-badge { font-size: 11px; font-weight: 900; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 6px; }
    .sc-win  { background: var(--green-glow, rgba(34,197,94,0.15)); color: var(--green, #22c55e); }
    .sc-draw { background: var(--bg-surface, #0d0d0d); color: var(--text-secondary, #a1a1aa); }
    .sc-loss { background: rgba(239,68,68,0.12); color: var(--red, #ef4444); }
    .sc-elo { font-size: 14px; font-weight: 800; color: var(--text-secondary, #a1a1aa); }
    .sc-elo-pos { color: var(--green, #22c55e); }
    .sc-elo-neg { color: var(--red, #ef4444); }
    .sc-new-elo { font-size: 12px; color: var(--text-muted, #52525b); margin-left: auto; }
    .sc-url { font-size: 11px; color: var(--text-muted, #52525b); font-family: monospace; margin-top: 4px; }

    /* Share action buttons */
    .share-actions { display: flex; gap: 10px; }
    .share-btn { flex: 1; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all .18s; }
    .share-btn-img { background: var(--bg-elevated, #141414); color: var(--text-primary, #fff); border: 1px solid var(--border-bright, #2a2a2a); }
    .share-btn-img:hover { border-color: var(--green, #22c55e); color: var(--green, #22c55e); }
    .share-btn-img.copied { background: var(--green-glow, rgba(34,197,94,0.12)); color: var(--green, #22c55e); border-color: var(--green, #22c55e); }
    .share-btn-link { background: #1a1a1a; color: #ccc; border: 1px solid #2a2a2a; }
    .share-btn-link:hover { background: #222; }
    .share-btn-link.copied { background: #1a2a1a; color: #22c55e; border-color: rgba(34,197,94,0.3); }

  `],
})
export class ArenaComponent implements OnInit, OnDestroy {
  @ViewChild('opponentEditor') opponentEditor?: MonacoEditorComponent;
  @ViewChild('myEditor') myEditor?: MonacoEditorComponent;
  @ViewChild('shareCard') shareCardEl?: ElementRef<HTMLElement>;

  state = signal<MatchState>('idle');
  matchId = signal('');
  roomId = signal('');
  opponentCode = signal('');
  opponentSubmitted = signal(false);
  challenge = signal<Challenge | null>(null);
  myResult = signal<SubmissionResult | null>(null);
  isWinner = signal(false);
  isDraw = signal(false);
  descExpanded = signal(false);

  // Post-match data
  finishedData = signal<{
    winnerId: string | null;
    draw: boolean;
    eloChange: number;
    rounds: Array<{
      roundNumber: number;
      challengeTitle: string;
      winnerId: string | null;
      p1Code: string;
      p2Code: string;
      p1Time: number;
      p2Time: number;
    }>;
    player1Id: string;
    player2Id: string;
  } | null>(null);
  activeRoundTab = signal(0);
  showShareModal = signal(false);
  imageCopied = signal(false);
  linkCopied = signal(false);

  // Private room
  roomCode = signal('');
  creatingRoom = signal(false);
  joinCodeInput = '';
  codeCopied = signal(false);
  roomError = signal('');
  // Disconnect
  opponentDisconnected = signal(false);
  disconnectCountdown = signal(30);
  private disconnectTimer: any;

  // Match Found screen
  foundOpponent = signal<{ username: string; avatarUrl: string | null; rating: number; tier: string } | null>(null);
  matchFoundCountdown = signal(5);
  matchFoundGo = signal(false);
  private matchFoundTimer: any;
  private pendingStart: (() => void) | null = null;
  private goFlashDone = false;

  // Game mode
  selectedMode = signal<GameMode>('1v1');

  // Challenge modal
  showChallengeModal = signal(false);
  modalCountdown = signal(15);
  private modalTimer: any;

  // Dynamic rounds — 1 round, winner takes all
  currentRound = signal(1);
  winsToWin = signal(1);
  myRoundWins = signal(0);
  opponentRoundWins = signal(0);
  lastRoundWon = signal(false);
  lastRoundDraw = signal(false);

  starterCode = '// Write your solution here\n';
  language = signal('javascript');
  private myCurrentCode = '';

  private http = inject(HttpClient);

  constructor(
    public authService: AuthService,
    private socketService: SocketService,
    public rankModal: RankModalService,
    public gameSetup: GameSetupModalService,
  ) {}

  ngOnInit(): void {
    this.socketService.connect();

    this.socketService.on('match:waiting', () => this.state.set('waiting'));
    // match:generating is now ignored — match:found handles the transition
    this.socketService.on('match:generating', () => {});

    // ── Match Found screen ────────────────────────────────────────────────
    this.socketService.on<{
      me: { username: string; avatarUrl: string | null; rating: number; tier: string };
      opponent: { username: string; avatarUrl: string | null; rating: number; tier: string };
      language: string; difficulty: string;
    }>('match:found', (data) => {
      this.foundOpponent.set(data.opponent);
      this.matchFoundCountdown.set(5);
      this.matchFoundGo.set(false);
      this.goFlashDone = false;
      this.state.set('match_found');
      this.pendingStart = null;
      this.playMatchFoundSound();

      // Countdown 5 → 1, then GO! flash, then start
      let secs = 5;
      clearInterval(this.matchFoundTimer);
      this.matchFoundTimer = setInterval(() => {
        secs--;
        if (secs > 0) {
          this.matchFoundCountdown.set(secs);
        } else {
          clearInterval(this.matchFoundTimer);
          this.matchFoundCountdown.set(0);
          this.matchFoundGo.set(true);
          setTimeout(() => {
            this.goFlashDone = true;
            if (this.pendingStart) {
              // match:started already arrived while we were flashing — start now
              this.pendingStart();
              this.pendingStart = null;
            }
            // If match:started hasn't arrived yet, match:started handler will
            // see goFlashDone=true and call startMatch() directly
          }, 700);
        }
      }, 1000);
    });

    this.socketService.on<{
      matchId: string; roomId: string; round: number; winsToWin: number;
      starterCode: string; language: string; challenge: Challenge | null;
    }>('match:started', (data) => {
      const startMatch = () => {
        this.matchId.set(data.matchId);
        this.roomId.set(data.roomId);
        this.currentRound.set(data.round);
        this.winsToWin.set(data.winsToWin);
        this.starterCode = data.starterCode;
        this.language.set(data.language);
        this.myEditor?.setLanguage(data.language);
        this.opponentEditor?.setLanguage(data.language);
        this.challenge.set(data.challenge);
        this.myCurrentCode = data.starterCode;
        this.descExpanded.set(false);
        this.opponentSubmitted.set(false);
        this.state.set('playing');
        this.openChallengeModal();
      };

      if (this.state() !== 'match_found') {
        startMatch();
      } else if (this.goFlashDone) {
        // GO! flash already finished — start immediately
        startMatch();
      } else {
        // Still counting down or flashing — queue for when flash ends
        this.pendingStart = startMatch;
      }
    });

    // Next round: new challenge
    this.socketService.on<{
      round: number; winsToWin: number;
      starterCode: string; language: string; challenge: Challenge;
    }>('match:next_round', (data) => {
      this.currentRound.set(data.round);
      this.winsToWin.set(data.winsToWin);
      this.starterCode = data.starterCode;
      this.language.set(data.language);
      this.myEditor?.setLanguage(data.language);
      this.opponentEditor?.setLanguage(data.language);
      this.challenge.set(data.challenge);
      this.myCurrentCode = data.starterCode;
      this.myResult.set(null);
      this.descExpanded.set(false);
      this.opponentSubmitted.set(false);
      this.myEditor?.setValue(data.starterCode);
      this.opponentEditor?.setValue('');
      this.opponentCode.set('');
      this.state.set('playing');
      this.openChallengeModal();
    });

    this.socketService.on<{ code: string }>('match:opponent_code', ({ code }) => {
      this.opponentCode.set(code);
      this.opponentEditor?.setValue(code);
    });

    this.socketService.on('match:judging', () => this.state.set('judging'));

    this.socketService.on<SubmissionResult>('match:submission_result', (result) => {
      this.myResult.set(result);
    });

    this.socketService.on('match:opponent_submitted', () => {
      this.opponentSubmitted.set(true);
    });

    // Round finished — show brief result screen
    this.socketService.on<{
      round: number; roundWinnerId: string | null; draw: boolean;
      scores: Record<string, number>;
    }>('match:round_finished', (data) => {
      const myId = this.authService.user()?.id ?? '';
      const myWins = data.scores[myId] ?? 0;
      const oppWins = Object.entries(data.scores).find(([id]) => id !== myId)?.[1] ?? 0;
      this.myRoundWins.set(myWins);
      this.opponentRoundWins.set(oppWins);
      this.lastRoundWon.set(data.roundWinnerId === myId);
      this.lastRoundDraw.set(data.draw);
      this.state.set('round_result');
    });

    this.socketService.on<{
      winnerId: string | null; draw: boolean; eloChange: number;
      rounds: any[]; player1Id: string; player2Id: string; matchId: string;
    }>('match:finished', (data) => {
      const myId = this.authService.user()?.id;
      this.isWinner.set(data.winnerId === myId);
      this.isDraw.set(data.draw);
      this.finishedData.set(data);
      this.activeRoundTab.set(0);
      this.state.set('finished');
      this.authService.fetchProfile().subscribe();
      this.opponentDisconnected.set(false);
      clearInterval(this.disconnectTimer);
    });

    // Disconnect events
    this.socketService.on<{ username: string; reconnectWindow: number }>('match:opponent_disconnected', (data) => {
      this.opponentDisconnected.set(true);
      this.disconnectCountdown.set(data.reconnectWindow);
      this.disconnectTimer = setInterval(() => {
        this.disconnectCountdown.update(n => {
          if (n <= 1) { clearInterval(this.disconnectTimer); return 0; }
          return n - 1;
        });
      }, 1000);
    });

    this.socketService.on('match:opponent_reconnected', () => {
      this.opponentDisconnected.set(false);
      clearInterval(this.disconnectTimer);
    });

    this.socketService.on('match:opponent_forfeited', () => {
      this.opponentDisconnected.set(false);
      clearInterval(this.disconnectTimer);
    });

    // Private room events
    this.socketService.on<{ code: string }>('room:created', () => {});
    this.socketService.on<{ message: string }>('room:error', (data) => {
      this.roomError.set(data.message);
      this.creatingRoom.set(false);
    });
    this.socketService.on<{ username: string; count: number }>('room:player_joined', () => {
      this.state.set('generating');
    });
  }

  findMatch(): void {
    this.socketService.emit('match:join_queue', {
      language:   this.gameSetup.language(),
      difficulty: this.gameSetup.difficulty(),
    });
  }

  cancelQueue(): void {
    this.socketService.emit('match:leave_queue');
    this.state.set('idle');
  }

  onMyCodeChange(code: string): void {
    this.myCurrentCode = code;
    this.socketService.sendCodeUpdate(this.roomId(), code);
  }

  submitCode(): void {
    this.socketService.emit('match:submit', {
      roomId: this.roomId(),
      code: this.myCurrentCode,
      language: this.language(),
    });
    this.state.set('judging');
  }

  playAgain(): void {
    this.opponentCode.set('');
    this.opponentSubmitted.set(false);
    this.myResult.set(null);
    this.isWinner.set(false);
    this.isDraw.set(false);
    this.myRoundWins.set(0);
    this.opponentRoundWins.set(0);
    this.currentRound.set(1);
    this.challenge.set(null);
    this.finishedData.set(null);
    this.state.set('idle');
  }

  // ── Private room ──────────────────────────────────────────────────────────
  createRoom(): void {
    this.creatingRoom.set(true);
    this.roomError.set('');
    this.http.post<{ code: string; expiresAt: string }>('/api/rooms', {}).subscribe({
      next: (data) => {
        this.roomCode.set(data.code);
        this.creatingRoom.set(false);
        this.socketService.emit('room:create', { code: data.code });
      },
      error: () => { this.creatingRoom.set(false); this.roomError.set('Failed to create room'); },
    });
  }

  joinRoom(): void {
    const code = this.joinCodeInput.trim().toUpperCase();
    if (!code || code.length < 4) { this.roomError.set('Enter a valid code'); return; }
    this.roomError.set('');
    this.socketService.emit('room:join', { code });
  }

  copyRoomCode(): void {
    navigator.clipboard.writeText(this.roomCode()).then(() => {
      this.codeCopied.set(true);
      setTimeout(() => this.codeCopied.set(false), 2000);
    });
  }

  exportReport(): void {
    const code = this.roomCode();
    if (!code) return;
    this.http.get(`/api/rooms/${code}/report`).subscribe({
      next: (report) => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `matchmood-report-${code}.json`; a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  formatTime(ms: number): string {
    if (!ms) return '—';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  }

  copyLink(): void {
    const username = this.authService.user()?.username ?? '';
    navigator.clipboard.writeText(`https://matchmood.app/u/${username}`).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }

  async copyImage(): Promise<void> {
    const el = this.shareCardEl?.nativeElement;
    if (!el) return;

    const user = this.authService.user();
    const fd = this.finishedData();
    if (!user || !fd) return;

    const W = 480, H = 280;
    const canvas = document.createElement('canvas');
    canvas.width = W * 2; canvas.height = H * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d0d0d'); bg.addColorStop(1, '#111');
    ctx.fillStyle = bg;
    this.roundRect(ctx, 0, 0, W, H, 14);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
    this.roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 14);
    ctx.stroke();

    // Logo
    ctx.fillStyle = '#444'; ctx.font = '700 12px Inter, sans-serif';
    ctx.fillText('⚡ MatchMood', 24, 40);

    // Username vs opponent
    ctx.fillStyle = '#f0f0f0'; ctx.font = '700 18px Inter, sans-serif';
    ctx.fillText(`@${user.username}`, 24, 80);
    ctx.fillStyle = '#333'; ctx.font = '500 14px Inter, sans-serif';
    ctx.fillText('vs  opponent', 24, 102);

    // Challenge title
    const challenge = fd.rounds[0]?.challengeTitle ?? '';
    if (challenge) {
      ctx.fillStyle = '#444'; ctx.font = 'italic 12px Inter, sans-serif';
      ctx.fillText(`"${challenge}"`, 24, 130);
    }

    // Result badge
    const resultLabel = this.isWinner() ? 'WIN' : this.isDraw() ? 'DRAW' : 'LOSS';
    const resultColor = this.isWinner() ? '#22c55e' : this.isDraw() ? '#888' : '#f43f5e';
    const resultBg = this.isWinner() ? 'rgba(34,197,94,0.15)' : this.isDraw() ? 'rgba(136,136,136,0.12)' : 'rgba(244,63,94,0.12)';
    ctx.fillStyle = resultBg;
    this.roundRect(ctx, 24, 154, 62, 26, 6); ctx.fill();
    ctx.fillStyle = resultColor; ctx.font = '900 11px Inter, sans-serif';
    ctx.fillText(resultLabel, 38, 172);

    // ELO change
    const eloSign = this.isWinner() ? '+' : this.isDraw() ? '±' : '−';
    const eloStr = `${eloSign}${fd.eloChange} ELO`;
    ctx.fillStyle = resultColor; ctx.font = '800 16px Inter, sans-serif';
    ctx.fillText(eloStr, 98, 172);

    ctx.fillStyle = '#444'; ctx.font = '500 12px Inter, sans-serif';
    ctx.fillText(`${user.rating} total`, 98 + ctx.measureText(eloStr).width + 12, 172);

    // URL
    ctx.fillStyle = '#2a2a2a'; ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText(`matchmood.app/u/${user.username}`, 24, H - 20);

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.imageCopied.set(true);
        setTimeout(() => this.imageCopied.set(false), 2000);
      }, 'image/png');
    } catch {
      // Fallback: open canvas in new tab
      window.open(canvas.toDataURL('image/png'));
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  selectMode(mode: GameMode): void {
    this.selectedMode.set(mode);
  }

  userRank(rating: number) { return getRank(rating); }

  langLabel(id: string): string {
    const map: Record<string, string> = {
      javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
      go: 'Go', rust: 'Rust', java: 'Java', cpp: 'C++',
    };
    return map[id] ?? id;
  }

  langAvailable(id: string): string {
    const map: Record<string, string> = {
      javascript: 'Array, Map, Set, Math, JSON',
      typescript: 'Array, Map, Set, Math, JSON',
      python:     'list, dict, set, collections, itertools',
      go:         'fmt, sort, strings, strconv, math',
      rust:       'Vec, HashMap, HashSet, std::cmp',
      java:       'ArrayList, HashMap, Arrays, Math, Collections',
      cpp:        'vector, map, set, algorithm, bits/stdc++',
    };
    return map[id] ?? 'Standard library';
  }

  langColor(): string {
    const map: Record<string, string> = {
      javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab',
      go: '#00add8', rust: '#f74c00', java: '#f89820', cpp: '#9c33b5',
    };
    return map[this.gameSetup.language()] ?? '#22c55e';
  }

  modeColor(): string {
    const colors: Record<GameMode, string> = {
      '1v1': '#22c55e',
      '2v2': '#16a34a',
      'ffa': '#4ade80',
      'private': '#10b981',
    };
    return colors[this.selectedMode()];
  }

  modeIcon(): string {
    const icons: Record<GameMode, string> = { '1v1': '⚔', '2v2': '🤝', 'ffa': '🔥', 'private': '🏢' };
    return icons[this.selectedMode()];
  }

  modeTitle(): string {
    const titles: Record<GameMode, string> = {
      '1v1': '1v1 Challenge',
      '2v2': '2v2 Teams',
      'ffa': 'Free for All',
      'private': 'Private Room',
    };
    return titles[this.selectedMode()];
  }

  modeDesc(): string {
    const descs: Record<GameMode, string> = {
      '1v1': 'Get matched with a developer at your level. First to win 3 rounds takes the match — rounds keep going until someone does.',
      '2v2': 'Team up with another developer. Divide and conquer the challenge together.',
      'ffa': 'Up to 4 developers. One problem. Last one standing wins.',
      'private': 'Host a private session for up to 12 participants. Set the challenge, watch screens and cameras live. Enterprise only.',
    };
    return descs[this.selectedMode()];
  }

  modeActionLabel(): string {
    const mode = this.selectedMode();
    if (mode === '1v1') return 'Find Match';
    if (mode === 'private') {
      return this.authService.user()?.tier === 'ENTERPRISE' ? 'Create Room (coming soon)' : 'Upgrade to Enterprise';
    }
    return 'Coming soon';
  }

  handleModeAction(): void {
    const mode = this.selectedMode();
    if (mode === '1v1') {
      this.gameSetup.open(() => this.findMatch());
      return;
    }
    if (mode === 'private') {
      if (this.authService.user()?.tier !== 'ENTERPRISE') {
        window.location.href = '/subscription';
      }
      return;
    }
    // 2v2 / ffa — coming soon, do nothing
  }

  roundsArray(): number[] {
    return Array.from({ length: this.winsToWin() }, (_, i) => i + 1);
  }

  private openChallengeModal(): void {
    this.showChallengeModal.set(true);
    this.modalCountdown.set(30);
    clearInterval(this.modalTimer);
    this.modalTimer = setInterval(() => {
      const current = this.modalCountdown();
      if (current <= 1) {
        this.closeModal();
      } else {
        this.modalCountdown.set(current - 1);
      }
    }, 1000);
  }

  closeModal(): void {
    this.showChallengeModal.set(false);
    clearInterval(this.modalTimer);
  }

  // ── Sound effects ─────────────────────────────────────────────────────────

  playMatchFoundSound(): void {
    const ctx = new AudioContext();
    const play = (freq: number, start: number, dur: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.266, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    play(660, 0,    0.35);  // Mi5
    play(990, 0.18, 0.5);   // Si5
  }

  ngOnDestroy(): void {
    clearInterval(this.modalTimer);
    clearInterval(this.matchFoundTimer);
    ['match:waiting','match:generating','match:found','match:started','match:next_round','match:opponent_code',
     'match:judging','match:submission_result','match:opponent_submitted','match:round_finished','match:finished']
      .forEach((e) => this.socketService.off(e));
  }
}
