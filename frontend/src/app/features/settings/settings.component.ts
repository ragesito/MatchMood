import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, of, Subject } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

type Tab = 'profile' | 'appearance' | 'notifications' | 'privacy' | 'gameplay' | 'danger';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="sp page-enter">

      <!-- Header -->
      <div class="sp-hdr">
        <div class="sp-hdr-inner">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <!-- Tab bar -->
      <div class="tab-bar">
        <div class="tab-bar-inner">
        <button class="tab" [class.active]="activeTab()==='profile'" (click)="activeTab.set('profile')">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" width="15" height="15"><circle cx="9" cy="6" r="3"/><path d="M2.5 16c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/></svg>
          Profile
        </button>
        <button class="tab" [class.active]="activeTab()==='appearance'" (click)="activeTab.set('appearance')">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" width="15" height="15"><circle cx="9" cy="9" r="7"/><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.1 4.1l1.4 1.4M12.5 12.5l1.4 1.4M4.1 13.9l1.4-1.4M12.5 5.5l1.4-1.4"/></svg>
          Appearance
        </button>
        <button class="tab" [class.active]="activeTab()==='notifications'" (click)="activeTab.set('notifications')">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" width="15" height="15"><path d="M9 2a5 5 0 0 1 5 5v3l1.5 2H2.5L4 10V7a5 5 0 0 1 5-5z"/><path d="M7 14.5a2 2 0 0 0 4 0"/></svg>
          Notifications
        </button>
        <button class="tab" [class.active]="activeTab()==='privacy'" (click)="activeTab.set('privacy')">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" width="15" height="15"><path d="M9 1L2.5 4v5c0 4 3 7 6.5 8 3.5-1 6.5-4 6.5-8V4z"/></svg>
          Privacy
        </button>
        <button class="tab" [class.active]="activeTab()==='gameplay'" (click)="activeTab.set('gameplay')">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" width="15" height="15"><path d="M10 2L6 10h4l-2 6 6-8h-4z"/></svg>
          Gameplay
        </button>
        <button class="tab tab-danger" [class.active]="activeTab()==='danger'" (click)="activeTab.set('danger')">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" width="15" height="15"><path d="M9 2L1.5 15h15z"/><path d="M9 7v4M9 13v1"/></svg>
          Danger
        </button>
        </div>
      </div>

      <!-- Content -->
      <div class="sc">
        <div class="sc-inner">

          <!-- ══ PROFILE ══ -->
          @if (activeTab() === 'profile') {
            @if (authService.user(); as u) {

              <!-- Hero -->
              <div class="profile-hero" [class.hero-premium]="isPremium()" [class.hero-enterprise]="isEnterprise()">
                <div class="hero-av-wrap">
                  @if (isPremium() || isEnterprise()) {
                    <div class="ring-spin" [class.ring-ent]="isEnterprise()"></div>
                  }
                  <img [src]="u.avatarUrl || 'https://github.com/ghost.png'" class="hero-av" />
                </div>
                <div class="hero-meta">
                  <div class="hero-name">{{ u.username }}</div>
                  <div class="hero-tier tier-badge-{{ u.tier.toLowerCase() }}">{{ tierLabel(u.tier) }}</div>
                </div>
                <div class="hero-stats">
                  <div class="hst"><div class="hst-v">{{ u.rating }}</div><div class="hst-l">ELO</div></div>
                  <div class="hst-sep"></div>
                  <div class="hst"><div class="hst-v">{{ u.wins }}</div><div class="hst-l">Wins</div></div>
                  <div class="hst-sep"></div>
                  <div class="hst"><div class="hst-v">{{ winRate() }}%</div><div class="hst-l">Win rate</div></div>
                </div>
              </div>

              <!-- Account card -->
              <div class="s-card">
                <div class="s-hd">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="5" r="2.5"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg>
                  Account
                </div>

                <div class="field">
                  <label class="fl">Username</label>
                  <div class="field-row">
                    <input class="fi" type="text" [(ngModel)]="usernameInput" (ngModelChange)="onUsernameChange($event)" maxlength="20" autocomplete="off" placeholder="your_handle" />
                    <button class="btn-save" [disabled]="!canSaveUsername()" (click)="saveUsername()">
                      {{ usernameSaved() ? '✓ Saved' : 'Save' }}
                    </button>
                  </div>
                  @if (usernameError()) {
                    <span class="fs fs-err">✗ {{ usernameError() }}</span>
                  } @else if (checkingUsername()) {
                    <span class="fs fs-hint">Checking availability...</span>
                  } @else if (usernameInput.length >= 3 && usernameInput !== u.username && !usernameError()) {
                    <span class="fs fs-ok">✓ Available</span>
                  }
                  <div class="fwarn">
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M7 2.5L1 12h12z"/><path d="M7 6v3M7 11v.5"/></svg>
                    Changing your username will break existing shared profile links.
                  </div>
                </div>

                <div class="divider"></div>

                <div class="field">
                  <label class="fl">Bio <span class="badge-mock">mock</span></label>
                  <textarea class="fi fi-ta" placeholder="Tell the community about yourself..." maxlength="160" [(ngModel)]="bio" rows="3"></textarea>
                  <span class="fs fs-hint" style="text-align:right">{{ bio().length }}/160</span>
                </div>

                <div class="divider"></div>

                <div class="field">
                  <label class="fl">
                    Preferred Language
                    @if (langSaved()) { <span class="fs-ok" style="margin-left:8px;font-size:11px">✓ Saved</span> }
                  </label>
                  <div class="lang-grid">
                    @for (lang of langs; track lang.id) {
                      <button class="lang-card" [class.active]="selectedLang === lang.id" (click)="setLang(lang.id)">
                        <span class="lang-dot" [style.background]="lang.color"></span>
                        {{ lang.label }}
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Social links card -->
              <div class="s-card">
                <div class="s-hd">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M10 2h4v4M14 2l-6 6M7 4H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"/></svg>
                  Social Links <span class="badge-mock" style="margin-left:6px">mock</span>
                </div>

                <div class="field">
                  <label class="fl">
                    GitHub
                    @if (u.hasGithub) {
                      <span class="badge-connected">● Connected</span>
                    }
                  </label>
                  @if (u.hasGithub && u.githubUsername) {
                    <div class="connected-row">
                      <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.7 7.7 0 0 1 8 4.07c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z"/></svg>
                      <span class="connected-val">github.com/{{ u.githubUsername }}</span>
                    </div>
                  } @else {
                    <a class="connect-github-btn" [href]="githubOAuthUrl">
                      <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.7 7.7 0 0 1 8 4.07c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z"/></svg>
                      Connect GitHub
                    </a>
                  }
                </div>

                <div class="divider"></div>

                <div class="field">
                  <label class="fl">Portfolio URL</label>
                  <input class="fi" type="url" placeholder="https://yoursite.com" [(ngModel)]="portfolioUrl" />
                </div>

                <div class="divider"></div>

                <div class="field">
                  <label class="fl">Twitter / X</label>
                  <div class="fi-pfx-wrap">
                    <span class="fi-pfx">&#64;</span>
                    <input class="fi fi-pfx-input" type="text" placeholder="yourhandle" [(ngModel)]="twitterHandle" />
                  </div>
                </div>
              </div>

            }
          }

          <!-- ══ APPEARANCE ══ -->
          @if (activeTab() === 'appearance') {

            <div class="s-card">
              <div class="s-hd">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>
                Theme
              </div>
              <div class="theme-grid">
                @for (t of themes; track t.id) {
                  <button class="theme-card" [class.active]="selectedTheme() === t.id" (click)="setTheme(t.id)">
                    <div class="tp tp-{{ t.id }}">
                      <div class="tp-topbar"></div>
                      <div class="tp-body">
                        <div class="tp-sidebar"></div>
                        <div class="tp-main">
                          <div class="tp-line"></div>
                          <div class="tp-line tp-short"></div>
                          <div class="tp-line"></div>
                          <div class="tp-line tp-short"></div>
                        </div>
                      </div>
                    </div>
                    <div class="tc-foot">
                      <span>{{ t.label }}</span>
                      @if (selectedTheme() === t.id) { <span class="tc-check">✓</span> }
                    </div>
                  </button>
                }
              </div>
            </div>

            <div class="s-card">
              <div class="s-hd">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M2 5h12M2 8h8M2 11h10"/></svg>
                Interface
              </div>
              <div class="toggle-row">
                <div class="ti">
                  <span class="tl">Compact sidebar <span class="badge-mock">mock</span></span>
                  <span class="td">Reduce sidebar padding and icon sizes</span>
                </div>
                <button class="tog" [class.on]="compactSidebar()" (click)="compactSidebar.set(!compactSidebar())"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti">
                  <span class="tl">Reduce motion <span class="badge-mock">mock</span></span>
                  <span class="td">Minimize animations and transitions throughout the app</span>
                </div>
                <button class="tog" [class.on]="reduceMotion()" (click)="reduceMotion.set(!reduceMotion())"><span class="tog-knob"></span></button>
              </div>
            </div>

          }

          <!-- ══ NOTIFICATIONS ══ -->
          @if (activeTab() === 'notifications') {

            <div class="s-card">
              <div class="s-hd">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M8 1a4.5 4.5 0 0 1 4.5 4.5v3L14 11H2l1.5-2.5V5.5A4.5 4.5 0 0 1 8 1z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></svg>
                In-app Notifications
              </div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">Match invites</span><span class="td">Get notified when someone challenges you</span></div>
                <button class="tog" [class.on]="notifMatches()" (click)="toggleNotif('matches')"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti">
                  <span class="tl">New challenger nearby <span class="badge-mock">mock</span></span>
                  <span class="td">Someone with a similar ELO just joined the queue</span>
                </div>
                <button class="tog" [class.on]="notifNewChallenger()" (click)="notifNewChallenger.set(!notifNewChallenger())"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">ELO milestones</span><span class="td">When you cross a rank threshold</span></div>
                <button class="tog" [class.on]="notifMilestone()" (click)="toggleNotif('milestone')"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti">
                  <span class="tl">Friend comes online <span class="badge-mock">mock</span></span>
                  <span class="td">When a followed player starts a session</span>
                </div>
                <button class="tog" [class.on]="notifFriendOnline()" (click)="notifFriendOnline.set(!notifFriendOnline())"><span class="tog-knob"></span></button>
              </div>
            </div>

            <div class="s-card">
              <div class="s-hd">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 6l7 4 7-4"/></svg>
                Email
              </div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">Weekly summary</span><span class="td">Your performance recap every Monday</span></div>
                <button class="tog" [class.on]="notifSummary()" (click)="toggleNotif('summary')"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="cs-row">
                <span class="cs-badge">Coming soon</span>
                Push notifications are not available yet.
              </div>
            </div>

          }

          <!-- ══ PRIVACY ══ -->
          @if (activeTab() === 'privacy') {

            <div class="s-card">
              <div class="s-hd">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M5 8a5 5 0 0 0 3 2.5A5 5 0 0 0 11 8a5 5 0 0 0-3-2.5A5 5 0 0 0 5 8z"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/></svg>
                Visibility
              </div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">Public profile</span><span class="td">Anyone can view your profile and match history</span></div>
                <button class="tog" [class.on]="publicProfile()" (click)="publicProfile.set(!publicProfile())"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">Show online status</span><span class="td">Let others see when you're active on the platform</span></div>
                <button class="tog" [class.on]="showOnlineStatus()" (click)="showOnlineStatus.set(!showOnlineStatus())"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">Show ELO on public profile</span><span class="td">Display your rating to anyone who views your profile</span></div>
                <button class="tog" [class.on]="showEloPublic()" (click)="showEloPublic.set(!showEloPublic())"><span class="tog-knob"></span></button>
              </div>
            </div>

            <div class="s-card">
              <div class="s-hd">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="5" cy="5" r="2.5"/><circle cx="11" cy="11" r="2.5"/><path d="M7.5 5h2a2 2 0 0 1 2 2v1.5M3.5 8.5V10a2 2 0 0 0 2 2h1.5"/></svg>
                Interactions
              </div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">Allow spectators in matches</span><span class="td">Other players can watch your live matches in real time</span></div>
                <button class="tog" [class.on]="allowSpectators()" (click)="allowSpectators.set(!allowSpectators())"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti">
                  <span class="tl">Allow direct messages <span class="badge-mock">mock</span></span>
                  <span class="td">Let other players send you messages directly</span>
                </div>
                <button class="tog" [class.on]="allowDMs()" (click)="allowDMs.set(!allowDMs())"><span class="tog-knob"></span></button>
              </div>
            </div>

          }

          <!-- ══ GAMEPLAY ══ -->
          @if (activeTab() === 'gameplay') {

            <div class="s-card">
              <div class="s-hd">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M9 1.5L5.5 9H9l-2 5.5 7-8H10z"/></svg>
                Match Preferences <span class="badge-mock" style="margin-left:6px">mock</span>
              </div>

              <div class="field">
                <label class="fl">Default difficulty</label>
                <div class="pill-group">
                  <button class="pill pill-easy"   [class.active]="defaultDiff()==='easy'"   (click)="defaultDiff.set('easy')">Easy</button>
                  <button class="pill pill-medium" [class.active]="defaultDiff()==='medium'" (click)="defaultDiff.set('medium')">Medium</button>
                  <button class="pill pill-hard"   [class.active]="defaultDiff()==='hard'"   (click)="defaultDiff.set('hard')">Hard</button>
                </div>
              </div>

              <div class="divider"></div>

              <div class="field">
                <label class="fl">Time limit per match</label>
                <div class="pill-group">
                  <button class="pill" [class.active]="matchDuration()==='5'"  (click)="matchDuration.set('5')">5 min</button>
                  <button class="pill" [class.active]="matchDuration()==='10'" (click)="matchDuration.set('10')">10 min</button>
                  <button class="pill" [class.active]="matchDuration()==='15'" (click)="matchDuration.set('15')">15 min</button>
                </div>
              </div>

              <div class="divider"></div>

              <div class="toggle-row">
                <div class="ti"><span class="tl">Auto-accept from followed players</span><span class="td">Skip the challenge dialog for players you follow</span></div>
                <button class="tog" [class.on]="autoAccept()" (click)="autoAccept.set(!autoAccept())"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">Show optimal solution after match</span><span class="td">Reveal the best approach once the match ends</span></div>
                <button class="tog" [class.on]="showSolution()" (click)="showSolution.set(!showSolution())"><span class="tog-knob"></span></button>
              </div>
              <div class="divider"></div>
              <div class="toggle-row">
                <div class="ti"><span class="tl">Practice mode (no ELO impact)</span><span class="td">Play casual matches without affecting your rating</span></div>
                <button class="tog" [class.on]="practiceMode()" (click)="practiceMode.set(!practiceMode())"><span class="tog-knob"></span></button>
              </div>
            </div>

          }

          <!-- ══ DANGER ══ -->
          @if (activeTab() === 'danger') {

            <div class="s-card s-card-danger">
              <div class="s-hd s-hd-danger">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M8 2L1 14h14z"/><path d="M8 6.5v3M8 11.5v.5"/></svg>
                Danger Zone
              </div>

              <div class="danger-row">
                <div>
                  <div class="fl">Export my data <span class="badge-mock">mock</span></div>
                  <div class="td">Download all your matches, stats, and profile as JSON</div>
                </div>
                <button class="btn-export">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M7 1v8M4 6l3 3 3-3M1 11v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"/></svg>
                  Export
                </button>
              </div>

              <div class="divider divider-red"></div>

              <div class="danger-row">
                <div>
                  <div class="fl">Reset match stats <span class="badge-mock">mock</span></div>
                  <div class="td">Wipe wins, losses and reset ELO to 1000. This cannot be undone.</div>
                </div>
                <button class="btn-reset">Reset stats</button>
              </div>

              <div class="divider divider-red"></div>

              <div class="danger-row">
                <div>
                  <div class="fl">Delete account</div>
                  <div class="td">Permanently delete your account and all associated data.</div>
                </div>
                <button class="btn-delete" (click)="showDeleteModal.set(true)">Delete account</button>
              </div>
            </div>

          }

        </div>
      </div>
    </div>

    <!-- Delete modal -->
    @if (showDeleteModal()) {
      <div class="modal-bd" (click)="showDeleteModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Delete your account?</h3>
          <p class="modal-desc">All your data, matches, and ELO will be permanently deleted. Type <strong>DELETE</strong> to confirm.</p>
          <input class="fi" type="text" [(ngModel)]="deleteConfirm" placeholder="DELETE" autocomplete="off" />
          <div class="modal-acts">
            <button class="btn-cancel" (click)="showDeleteModal.set(false)">Cancel</button>
            <button class="btn-del-confirm" [disabled]="deleteConfirm !== 'DELETE'" (click)="deleteAccount()">Delete forever</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Page shell ── */
    .sp        { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    /* header and tabs: full width but inner content pinned to same max-width as cards */
    .sp-hdr { flex-shrink: 0; border-bottom: none; }
    .sp-hdr-inner { max-width: 660px; margin: 0 auto; padding: 32px 0 0; }
    .sp-hdr h1 { font-size: 26px; font-weight: 800; letter-spacing: -.5px; margin: 0 0 4px; }
    .sp-hdr p  { font-size: 13px; color: var(--text-muted); margin: 0; }

    /* ── Tab bar ── */
    .tab-bar {
      flex-shrink: 0;
      border-bottom: 1px solid var(--border);
    }
    .tab-bar-inner {
      max-width: 660px; margin: 0 auto;
      display: flex; gap: 2px; padding: 20px 0 0;
    }
    .tab {
      display: flex; align-items: center; gap: 7px;
      padding: 10px 14px; border: none; background: none;
      font-size: 13px; font-weight: 500; color: var(--text-muted);
      cursor: pointer; border-bottom: 2px solid transparent;
      margin-bottom: -1px; white-space: nowrap;
      transition: color 150ms ease, border-color 150ms ease;
    }
    .tab:hover { color: var(--text-secondary); }
    .tab.active { color: var(--text-primary); border-bottom-color: var(--green); }
    .tab.active svg { stroke: var(--green); }
    .tab-danger.active { color: var(--red); border-bottom-color: var(--red); }
    .tab-danger.active svg { stroke: var(--red); }
    .tab-danger:hover { color: var(--red); }

    /* ── Scroll area ── */
    .sc       { flex: 1; overflow-y: auto; padding: 28px 32px 60px; }
    .sc-inner { max-width: 660px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 20px; }

    /* ── Profile hero ── */
    .profile-hero {
      display: flex; align-items: center; gap: 20px;
      padding: 20px 24px; border-radius: 14px;
      background: var(--bg-surface); border: 1px solid var(--border);
    }
    .hero-premium   { border-color: rgba(34,197,94,.25); background: linear-gradient(135deg, #030d03 0%, var(--bg-surface) 70%); }
    .hero-enterprise{ border-color: rgba(139,92,246,.25); background: linear-gradient(135deg, #07030f 0%, var(--bg-surface) 70%); }

    .hero-av-wrap { position: relative; flex-shrink: 0; width: 64px; height: 64px; }
    .hero-av      { width: 64px; height: 64px; border-radius: 50%; display: block; position: relative; z-index: 1; border: 2px solid var(--border); }
    .ring-spin {
      position: absolute; inset: -3px; border-radius: 50%; z-index: 0;
      background: conic-gradient(var(--green) 0deg, transparent 120deg, var(--green) 240deg, transparent 360deg);
      animation: ringRotate 3s linear infinite;
    }
    .ring-spin.ring-ent {
      background: conic-gradient(#a78bfa 0deg, transparent 120deg, #a78bfa 240deg, transparent 360deg);
    }
    @keyframes ringRotate { to { transform: rotate(360deg); } }

    .hero-meta    { flex: 1; }
    .hero-name    { font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
    .tier-badge-free       { font-size: 11px; font-weight: 700; color: var(--text-muted); }
    .tier-badge-premium    { font-size: 11px; font-weight: 700; color: var(--green); }
    .tier-badge-enterprise { font-size: 11px; font-weight: 700; color: #a78bfa; }

    .hero-stats { display: flex; align-items: center; gap: 16px; }
    .hst        { text-align: center; }
    .hst-v      { font-size: 18px; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .hst-l      { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; margin-top: 3px; }
    .hst-sep    { width: 1px; height: 28px; background: var(--border); }

    /* ── Cards ── */
    .s-card {
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 20px 22px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .s-hd {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: var(--text-muted);
      padding-bottom: 4px;
    }
    .s-card-danger  { border-color: rgba(239,68,68,.2); }
    .s-hd-danger    { color: var(--red); }
    .s-hd-danger svg { stroke: var(--red); }

    .divider     { height: 1px; background: var(--border); }
    .divider-red { background: rgba(239,68,68,.15); }

    /* ── Fields ── */
    .field  { display: flex; flex-direction: column; gap: 8px; }
    .fl     { font-size: 13px; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
    .field-row { display: flex; gap: 8px; }

    .fi {
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 13px; font-size: 13px;
      color: var(--text-primary); outline: none; flex: 1;
      transition: border-color 150ms ease; font-family: inherit;
    }
    .fi:focus { border-color: var(--green); }
    .fi-ta { resize: vertical; min-height: 72px; }

    .fi-pfx-wrap  { display: flex; position: relative; }
    .fi-pfx       { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--text-muted); pointer-events: none; }
    .fi-pfx-input { padding-left: 26px; }

    .fs       { font-size: 12px; }
    .fs-err   { color: var(--red); }
    .fs-ok    { color: var(--green); }
    .fs-hint  { color: var(--text-muted); }
    .fwarn    { font-size: 12px; color: var(--amber); display: flex; align-items: flex-start; gap: 6px; line-height: 1.4; }
    .fwarn svg { flex-shrink: 0; margin-top: 1px; stroke: var(--amber); }

    .btn-save {
      background: var(--bg-elevated); border: 1px solid var(--border-bright);
      color: var(--text-secondary); padding: 10px 16px; border-radius: 8px;
      font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
      transition: border-color 150ms ease, color 150ms ease;
    }
    .btn-save:hover:not(:disabled) { border-color: var(--green); color: var(--text-primary); }
    .btn-save:disabled { opacity: .4; cursor: not-allowed; }

    /* ── Language grid ── */
    .lang-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .lang-card {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 14px; border-radius: 8px;
      background: var(--bg-elevated); border: 1px solid var(--border);
      font-size: 12px; font-weight: 500; color: var(--text-muted);
      cursor: pointer; transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
    }
    .lang-card:hover { border-color: var(--border-bright); color: var(--text-secondary); }
    .lang-card.active { border-color: var(--green); color: var(--text-primary); background: rgba(34,197,94,.06); }
    .lang-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

    /* ── Social links ── */
    .connected-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 13px; border-radius: 8px;
      background: var(--bg-elevated); border: 1px solid var(--border);
      font-size: 13px; color: var(--text-muted);
    }
    .connected-row svg { fill: var(--text-muted); flex-shrink: 0; }
    .connected-val { font-size: 13px; color: var(--text-muted); }
    .badge-connected { font-size: 10px; font-weight: 700; color: var(--green); letter-spacing: .03em; }
    .connect-github-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600;
      border: 1px solid var(--border-bright, #2a2a2a);
      color: var(--text-secondary); background: var(--bg-surface);
      text-decoration: none; cursor: pointer;
      transition: border-color 150ms, color 150ms;
    }
    .connect-github-btn:hover { border-color: var(--green); color: var(--green); }

    /* ── Theme grid ── */
    .theme-grid { display: flex; gap: 12px; }
    .theme-card {
      flex: 1; display: flex; flex-direction: column;
      border: 1px solid var(--border); border-radius: 10px;
      overflow: hidden; cursor: pointer; background: none;
      transition: border-color 150ms ease, transform 150ms ease;
    }
    .theme-card:hover { border-color: var(--border-bright); transform: translateY(-2px); }
    .theme-card.active { border-color: var(--green); }

    .tp { height: 72px; overflow: hidden; }
    .tp-dark       { background: #0a0a0a; }
    .tp-light      { background: #f0f0f0; }
    .tp-system     { background: linear-gradient(135deg, #0a0a0a 50%, #f0f0f0 50%); }
    .tp-topbar     { height: 10px; background: rgba(255,255,255,.04); border-bottom: 1px solid rgba(255,255,255,.06); }
    .tp-light .tp-topbar { background: rgba(0,0,0,.04); border-color: rgba(0,0,0,.08); }
    .tp-body       { display: flex; flex: 1; padding: 6px; gap: 5px; height: calc(100% - 10px); }
    .tp-sidebar    { width: 14px; border-radius: 3px; background: rgba(255,255,255,.05); }
    .tp-light .tp-sidebar { background: rgba(0,0,0,.07); }
    .tp-main       { flex: 1; display: flex; flex-direction: column; gap: 4px; justify-content: center; }
    .tp-line       { height: 4px; border-radius: 2px; background: rgba(255,255,255,.1); }
    .tp-light .tp-line { background: rgba(0,0,0,.12); }
    .tp-short      { width: 60%; }

    .tc-foot {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 10px; font-size: 12px; font-weight: 600;
      color: var(--text-muted); background: var(--bg-surface);
      border-top: 1px solid var(--border);
    }
    .theme-card.active .tc-foot { color: var(--text-primary); }
    .tc-check { color: var(--green); font-size: 11px; }

    /* ── Toggles ── */
    .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .ti         { display: flex; flex-direction: column; gap: 3px; }
    .tl         { font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }
    .td         { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
    .tog        { width: 44px; height: 24px; border-radius: 12px; background: var(--bg-elevated); border: 1px solid var(--border); cursor: pointer; position: relative; flex-shrink: 0; transition: background 200ms ease, border-color 200ms ease; }
    .tog.on     { background: var(--green); border-color: var(--green); }
    .tog-knob   { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--text-muted); transition: transform 200ms ease, background 200ms ease; display: block; }
    .tog.on .tog-knob { transform: translateX(20px); background: #000; }

    /* ── Coming soon ── */
    .cs-row   { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-muted); }
    .cs-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: 3px 8px; border-radius: 4px; border: 1px solid var(--amber); color: var(--amber); white-space: nowrap; }

    /* ── Pill groups ── */
    .pill-group { display: flex; gap: 6px; }
    .pill {
      padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
      background: var(--bg-elevated); border: 1px solid var(--border);
      color: var(--text-muted); cursor: pointer;
      transition: border-color 150ms ease, color 150ms ease;
    }
    .pill:hover { border-color: var(--border-bright); color: var(--text-secondary); }
    .pill.active          { border-color: var(--green); color: var(--green); background: rgba(34,197,94,.06); }
    .pill-easy.active     { border-color: var(--green); color: var(--green); background: rgba(34,197,94,.06); }
    .pill-medium.active   { border-color: var(--amber); color: var(--amber); background: rgba(245,158,11,.06); }
    .pill-hard.active     { border-color: var(--red);   color: var(--red);   background: rgba(239,68,68,.06); }

    /* ── Danger buttons ── */
    .danger-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .danger-row .fl  { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
    .danger-row .td  { font-size: 12px; color: var(--text-muted); }
    .btn-export {
      display: flex; align-items: center; gap: 6px;
      background: transparent; border: 1px solid var(--border-bright); color: var(--text-secondary);
      padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; white-space: nowrap; flex-shrink: 0;
      transition: border-color 150ms ease, color 150ms ease;
    }
    .btn-export:hover { border-color: var(--green); color: var(--green); }
    .btn-export svg   { stroke: currentColor; }
    .btn-reset {
      background: transparent; border: 1px solid rgba(245,158,11,.4); color: var(--amber);
      padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; white-space: nowrap; flex-shrink: 0;
      transition: background 150ms ease, border-color 150ms ease;
    }
    .btn-reset:hover { background: rgba(245,158,11,.08); border-color: var(--amber); }
    .btn-delete {
      background: transparent; border: 1px solid rgba(239,68,68,.4); color: var(--red);
      padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; white-space: nowrap; flex-shrink: 0;
      transition: background 150ms ease, border-color 150ms ease;
    }
    .btn-delete:hover { background: rgba(239,68,68,.1); border-color: var(--red); }

    /* ── Badges ── */
    .badge-mock {
      font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
      padding: 2px 6px; border-radius: 4px;
      background: rgba(161,161,170,.1); color: var(--text-muted);
      border: 1px solid rgba(161,161,170,.2);
    }

    /* ── Modal ── */
    .modal-bd    { position: fixed; inset: 0; background: rgba(0,0,0,.85); backdrop-filter: blur(8px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal       { background: var(--bg-surface); border: 1px solid var(--border-bright); border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
    .modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-desc  { font-size: 14px; color: var(--text-muted); margin: 0; line-height: 1.5; }
    .modal-desc strong { color: var(--text-secondary); }
    .modal-acts  { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .btn-cancel  { background: transparent; border: 1px solid var(--border-bright); color: var(--text-secondary); padding: 10px 18px; border-radius: 8px; font-size: 14px; cursor: pointer; transition: color 150ms ease; }
    .btn-cancel:hover { color: var(--text-primary); }
    .btn-del-confirm { background: var(--red); color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 150ms ease; }
    .btn-del-confirm:hover:not(:disabled) { opacity: .85; }
    .btn-del-confirm:disabled { opacity: .4; cursor: not-allowed; }
  `],
})
export class SettingsComponent implements OnInit {
  authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  activeTab = signal<Tab>('profile');
  githubOAuthUrl = `${environment.apiUrl}/auth/github`;

  themes = [
    { id: 'dark',   label: 'Dark'   },
    { id: 'light',  label: 'Light'  },
    { id: 'system', label: 'System' },
  ];

  langs = [
    { id: 'javascript', label: 'JavaScript', color: '#f7df1e' },
    { id: 'typescript', label: 'TypeScript', color: '#3178c6' },
    { id: 'python',     label: 'Python',     color: '#3776ab' },
    { id: 'go',         label: 'Go',         color: '#00add8' },
    { id: 'rust',       label: 'Rust',       color: '#f74c00' },
    { id: 'java',       label: 'Java',       color: '#ed8b00' },
    { id: 'cpp',        label: 'C++',        color: '#659ad2' },
    { id: 'other',      label: 'Other',      color: '#6b7280' },
  ];

  // Existing
  usernameInput   = '';
  selectedLang    = '';
  selectedTheme   = signal('system');
  notifMatches    = signal(true);
  notifSummary    = signal(true);
  notifMilestone  = signal(true);
  checkingUsername = signal(false);
  usernameError   = signal<string | null>(null);
  usernameSaved   = signal(false);
  langSaved       = signal(false);
  showDeleteModal  = signal(false);
  deleteConfirm   = '';

  // New profile
  bio          = signal('');
  portfolioUrl = signal('');
  twitterHandle = signal('');

  // New appearance
  reduceMotion  = signal(false);
  compactSidebar = signal(false);

  // New notifications
  notifFriendOnline  = signal(false);
  notifNewChallenger = signal(true);

  // New privacy
  publicProfile    = signal(true);
  showOnlineStatus = signal(true);
  allowSpectators  = signal(true);
  showEloPublic    = signal(true);
  allowDMs         = signal(false);

  // New gameplay
  defaultDiff   = signal<string>('medium');
  matchDuration = signal<string>('10');
  autoAccept    = signal(false);
  showSolution  = signal(true);
  practiceMode  = signal(false);

  private usernameSubject = new Subject<string>();

  canSaveUsername = computed(() =>
    !this.checkingUsername() &&
    !this.usernameError() &&
    this.usernameInput.length >= 3 &&
    this.usernameInput !== this.authService.user()?.username
  );

  winRate = computed(() => {
    const u = this.authService.user();
    if (!u) return 0;
    const total = (u.wins || 0) + (u.losses || 0);
    return total === 0 ? 0 : Math.round(((u.wins || 0) / total) * 100);
  });

  isPremium    = computed(() => this.authService.user()?.tier === 'PREMIUM');
  isEnterprise = computed(() => this.authService.user()?.tier === 'ENTERPRISE');

  ngOnInit(): void {
    const u = this.authService.user();
    if (u) {
      this.usernameInput = u.username;
      this.selectedLang  = u.preferredLang;
      this.selectedTheme.set(u.theme);
      this.notifMatches.set(u.notifMatches);
      this.notifSummary.set(u.notifSummary);
      this.notifMilestone.set(u.notifMilestone);
    }

    this.usernameSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(val => {
        if (!val || !/^[a-zA-Z0-9_]{3,20}$/.test(val)) return of(null);
        this.checkingUsername.set(true);
        return this.http.get<{ available: boolean }>(`${environment.apiUrl}/auth/check-username?username=${encodeURIComponent(val)}`);
      })
    ).subscribe({
      next: r => {
        this.checkingUsername.set(false);
        if (r === null) {
          this.usernameError.set(this.usernameInput.length >= 3 ? 'Only letters, numbers and underscores (3-20 chars)' : null);
        } else {
          this.usernameError.set(r.available ? null : 'Username already taken');
        }
      },
      error: () => { this.checkingUsername.set(false); this.usernameError.set(null); },
    });
  }

  onUsernameChange(val: string): void {
    this.usernameError.set(null);
    if (val.length >= 3) this.usernameSubject.next(val);
  }

  saveUsername(): void {
    if (!this.canSaveUsername()) return;
    this.http.patch(`${environment.apiUrl}/settings/account`, { username: this.usernameInput }).subscribe({
      next: () => {
        this.usernameSaved.set(true);
        this.authService.fetchProfile().subscribe();
        setTimeout(() => this.usernameSaved.set(false), 2000);
      },
    });
  }

  setLang(lang: string): void {
    this.selectedLang = lang;
    this.http.patch(`${environment.apiUrl}/settings/account`, { preferredLang: lang }).subscribe({
      next: () => {
        this.langSaved.set(true);
        this.authService.fetchProfile().subscribe();
        setTimeout(() => this.langSaved.set(false), 1500);
      },
    });
  }

  saveLang(): void {
    this.http.patch(`${environment.apiUrl}/settings/account`, { preferredLang: this.selectedLang }).subscribe({
      next: () => {
        this.langSaved.set(true);
        this.authService.fetchProfile().subscribe();
        setTimeout(() => this.langSaved.set(false), 2000);
      },
    });
  }

  setTheme(theme: string): void {
    this.selectedTheme.set(theme);
    localStorage.setItem('mm-theme', theme);
    this.http.patch(`${environment.apiUrl}/settings/preferences`, { theme }).subscribe();
  }

  toggleNotif(type: string): void {
    if (type === 'matches')   this.notifMatches.update(v => !v);
    if (type === 'summary')   this.notifSummary.update(v => !v);
    if (type === 'milestone') this.notifMilestone.update(v => !v);
    this.http.patch(`${environment.apiUrl}/settings/preferences`, {
      notifMatches:   this.notifMatches(),
      notifSummary:   this.notifSummary(),
      notifMilestone: this.notifMilestone(),
    }).subscribe();
  }

  tierLabel(tier?: string): string {
    if (tier === 'PREMIUM')    return '★ Premium';
    if (tier === 'ENTERPRISE') return '✦ Enterprise';
    return 'Free';
  }

  deleteAccount(): void {
    if (this.deleteConfirm !== 'DELETE') return;
    this.http.delete(`${environment.apiUrl}/auth/account`).subscribe({
      next: () => { this.authService.logout(); },
    });
  }
}
