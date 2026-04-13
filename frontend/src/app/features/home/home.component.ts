import { Component, signal, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

type ModalMode = 'login' | 'signup' | null;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div [class]="'landing ' + theme()">

      <!-- ─── Navbar ─────────────────────────────────────────────────── -->
      <nav class="nav">
        <div class="nav-logo">
          <span class="logo-mark">▸</span>
          <span class="logo-text">matchmood</span>
        </div>
        <div class="nav-right">
          <a href="#game-modes" class="nav-link">Game modes</a>
          <a href="#companies" class="nav-link">For companies</a>
          <a href="#pricing" class="nav-link">Pricing</a>
          <button class="theme-toggle" (click)="toggleTheme()">{{ theme() === 'dark' ? '☀' : '☾' }}</button>
          @if (authService.isLoggedIn()) {
            <img [src]="authService.user()?.avatarUrl || 'https://github.com/ghost.png'" class="nav-avatar-img" alt="avatar" />
            <span class="nav-username-text">{{ authService.user()?.username }}</span>
            <a routerLink="/dashboard" class="btn-signup">Go to Dashboard</a>
          } @else {
            <button class="btn-login" (click)="openModal('login')">Log in</button>
            <button class="btn-signup" (click)="handleCta('signup')">Sign up</button>
          }
        </div>
      </nav>

      <!-- ─── Auth Modal ─────────────────────────────────────────────── -->
      @if (modal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="closeModal()">✕</button>

            <div class="modal-logo">
              <span class="logo-mark">▸</span>
              <span class="logo-text">matchmood</span>
            </div>

            <h2 class="modal-title">
              {{ modal() === 'login' ? 'Welcome back' : 'Join the arena' }}
            </h2>
            <p class="modal-sub">
              {{ modal() === 'login' ? 'Log in to your account' : 'Create your account and start competing' }}
            </p>

            <!-- GitHub CTA — primary -->
            <a [href]="loginUrl" class="btn-github">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub
              <span class="github-rec">Recommended for devs</span>
            </a>

            <div class="divider"><span>or</span></div>

            <!-- Email form -->
            <form class="modal-form" (submit)="submitForm($event)">
              <div class="form-field">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" autocomplete="email"
                       [(ngModel)]="formEmail" name="email"
                       [class.fi-err]="fieldError('email')" />
                @if (fieldError('email')) { <span class="fi-err-msg">{{ fieldError('email') }}</span> }
              </div>
              <div class="form-field">
                <label>Password</label>
                <div class="pw-wrap">
                  <input [type]="showPassword() ? 'text' : 'password'"
                         placeholder="••••••••"
                         [autocomplete]="modal()==='signup' ? 'new-password' : 'current-password'"
                         [(ngModel)]="formPassword" name="password"
                         [class.fi-err]="fieldError('password')" />
                  <button type="button" class="pw-toggle" (click)="showPassword.set(!showPassword())">
                    {{ showPassword() ? 'Hide' : 'Show' }}
                  </button>
                </div>
                @if (modal() === 'signup') {
                  <div class="pw-strength">
                    <div class="pw-bar" [class.s1]="pwStrength()>=1" [class.s2]="pwStrength()>=2" [class.s3]="pwStrength()>=3"></div>
                    <div class="pw-bar" [class.s2]="pwStrength()>=2" [class.s3]="pwStrength()>=3"></div>
                    <div class="pw-bar" [class.s3]="pwStrength()>=3"></div>
                    <span class="pw-label">{{ pwLabel() }}</span>
                  </div>
                }
                @if (fieldError('password')) { <span class="fi-err-msg">{{ fieldError('password') }}</span> }
              </div>

              @if (formError()) {
                <div class="form-error">{{ formError() }}</div>
              }

              <button type="submit" class="btn-form-submit" [disabled]="formLoading()">
                @if (formLoading()) { <span class="btn-spinner"></span> }
                {{ modal() === 'login' ? 'Log in' : 'Create account' }}
              </button>
            </form>

            <p class="modal-switch">
              @if (modal() === 'login') {
                Don't have an account?
                <button (click)="switchTo('signup')">Sign up</button>
              } @else {
                Already have an account?
                <button (click)="switchTo('login')">Log in</button>
              }
            </p>
          </div>
        </div>
      }

      <!-- ─── Hero ───────────────────────────────────────────────────── -->
      <section class="hero">
        <div class="hero-left">
          <div class="hero-left-inner">
            <p class="hero-eyebrow">1v1 · 2v2 · Free for all · AI-generated</p>
            <h1 class="hero-title">
              Code is the<br/>
              new<br/>
              <em>résumé.</em>
            </h1>
            <p class="hero-desc">
              Compete in real time algorithm battles.<br/>
              Build a verified profile. Get discovered by top companies.
            </p>
            <div class="hero-actions">
              <button class="btn-main" (click)="handleCta('signup')">Enter the arena</button>
              <a href="#companies" class="btn-text">I recruit developers →</a>
            </div>
          </div>
        </div>

        <div class="hero-right">
          <!-- Match card — taller -->
          <div class="match-card">
            <div class="match-header">
              <span class="live-dot"></span>
              <span class="live-text">LIVE MATCH</span>
              <span class="match-mode-tag">1v1</span>
            </div>
            <div class="match-title">Longest Substring Without Repeating</div>
            <div class="match-level">MEDIUM · JavaScript · 4:12 remaining</div>
            <div class="match-players">
              <div class="player">
                <div class="player-avatar p1">R</div>
                <div class="player-info">
                  <span class="player-name">robert <span class="blue-check">✓</span></span>
                  <span class="player-elo">1025 ELO</span>
                </div>
                <div class="player-tests pass">2/3 ✓</div>
              </div>
              <div class="vs-badge">VS</div>
              <div class="player">
                <div class="player-avatar p2">M</div>
                <div class="player-info">
                  <span class="player-name">mike</span>
                  <span class="player-elo">975 ELO</span>
                </div>
                <div class="player-tests fail">1/3 ✓</div>
              </div>
            </div>
            <div class="code-preview">
              <span class="code-line"><span class="kw">function</span> <span class="fn">lengthOfLongestSubstring</span>(s) &#123;</span>
              <span class="code-line pad"><span class="kw">const</span> map = <span class="kw">new</span> Map();</span>
              <span class="code-line pad"><span class="kw">let</span> left = <span class="num">0</span>, max = <span class="num">0</span>;</span>
              <span class="code-line pad"><span class="kw">for</span> (<span class="kw">let</span> i = <span class="num">0</span>; i &lt; s.length; i++) &#123;</span>
              <span class="code-line pad pad2"><span class="kw">if</span> (map.has(s[i])) &#123;</span>
              <span class="code-line pad pad3">left = Math.max(left, map.get(s[i]) + <span class="num">1</span>);</span>
              <span class="code-line pad pad2">&#125;</span>
              <span class="code-line pad pad2">map.set(s[i], i);</span>
              <span class="code-line pad pad2">max = Math.max(max, i - left + <span class="num">1</span>);</span>
              <span class="code-line pad">&#125;</span>
              <span class="code-line pad"><span class="kw">return</span> max;<span class="cursor">|</span></span>
              <span class="code-line">&#125;</span>
            </div>
          </div>

          <!-- Floating stat pills -->
          <div class="stat-pills">
            <div class="pill">
              <span class="pill-val">1,240</span>
              <span class="pill-label">matches today</span>
            </div>
            <div class="pill">
              <span class="pill-val">38s</span>
              <span class="pill-label">avg solve time</span>
            </div>
            <div class="pill pill-accent">
              <span class="pill-val">247</span>
              <span class="pill-label">devs online</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Statement bar ──────────────────────────────────────────── -->
      <div class="statement-bar reveal">
        <span>No fake problems</span>
        <span class="bar-dot">·</span>
        <span>No memorized solutions</span>
        <span class="bar-dot">·</span>
        <span>No bullshit interviews</span>
        <span class="bar-dot">·</span>
        <span>Just your code</span>
      </div>

      <!-- ─── Game modes ─────────────────────────────────────────────── -->
      <section class="modes" id="game-modes">
        <div class="modes-label reveal">GAME MODES</div>
        <h2 class="modes-title reveal" data-delay="1">Pick your battle.</h2>
        <div class="modes-grid">
          <div class="mode-card mode-active reveal" data-delay="1">
            <div class="mode-icon">⚔️</div>
            <div class="mode-name">1v1</div>
            <div class="mode-desc">Classic duel. You vs one opponent. Best code wins.</div>
            <div class="mode-tag">Available now</div>
          </div>
          <div class="mode-card reveal" data-delay="2">
            <div class="mode-icon">🔥</div>
            <div class="mode-name">Free for All</div>
            <div class="mode-desc">Up to 4 devs. One problem. Last one solving is out.</div>
            <div class="mode-tag coming">Coming soon</div>
          </div>
          <div class="mode-card reveal" data-delay="3">
            <div class="mode-icon">🤝</div>
            <div class="mode-name">2v2</div>
            <div class="mode-desc">Team up. Divide the problem. Win together or lose together.</div>
            <div class="mode-tag coming">Coming soon</div>
          </div>
          <div class="mode-card mode-enterprise reveal" data-delay="4">
            <div class="mode-icon">🏢</div>
            <div class="mode-name">Private Room</div>
            <div class="mode-desc">Company-hosted session. Up to 12 candidates. Live screens and cameras.</div>
            <div class="mode-tag enterprise-tag">Enterprise</div>
          </div>
        </div>
      </section>

      <!-- ─── How it works ───────────────────────────────────────────── -->
      <section class="how">
        <div class="how-label reveal">FOR DEVELOPERS</div>
        <div class="how-grid">
          <div class="how-text reveal" data-delay="1">
            <h2>Three minutes to prove<br/>what your CV can't.</h2>
            <p>Every match is a unique challenge created by AI on the spot. You can't Google the answer. You can't fake the stats. Only real skill compounds.</p>
            <div class="badge-row">
              <div class="badge-item">
                <span class="blue-check-lg">✓</span>
                <div>
                  <strong>Premium badge</strong>
                  <span>Verified performance · visible on your profile</span>
                </div>
              </div>
              <div class="badge-item badge-enterprise">
                <span class="em-check-lg">✦</span>
                <div>
                  <strong>Enterprise badge</strong>
                  <span>Company-level verification · top recruiter visibility</span>
                </div>
              </div>
            </div>
            <button class="btn-main" style="margin-top:32px;" (click)="handleCta('signup')">Start for free</button>
          </div>
          <div class="how-steps">
            <div class="how-step reveal" data-delay="2">
              <span class="step-n">01</span>
              <div>
                <strong>Sign in with GitHub</strong>
                <p>One click. Your coding identity is your profile. Recruiters find you by your real performance, not your bio.</p>
              </div>
            </div>
            <div class="how-step reveal" data-delay="3">
              <span class="step-n">02</span>
              <div>
                <strong>Get matched instantly</strong>
                <p>The system pairs you with a developer at your level. An AI generates a fresh problem — just for this match.</p>
              </div>
            </div>
            <div class="how-step reveal" data-delay="4">
              <span class="step-n">03</span>
              <div>
                <strong>Your rating grows publicly</strong>
                <p>Win rate, ELO, solve time — all public, all verified. Every user can see your stats. Premium users show more.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Companies ──────────────────────────────────────────────── -->
      <section class="companies" id="companies">
        <div class="companies-inner">
          <div class="companies-tag reveal">FOR COMPANIES</div>
          <h2 class="reveal" data-delay="1">You've read enough CVs.<br/>Watch them code instead.</h2>
          <p class="companies-sub reveal" data-delay="2">Access a ranked pool of developers proven under real pressure. Or host your own private challenge room and evaluate candidates live.</p>
          <div class="companies-grid">
            <div class="co-item reveal" data-delay="1">
              <span class="co-icon">⚡</span>
              <strong>Real performance data</strong>
              <p>ELO, win rate, avg solve time — earned in live competition. No self-reported skills.</p>
            </div>
            <div class="co-item reveal" data-delay="2">
              <span class="co-icon">🏠</span>
              <strong>Private challenge rooms</strong>
              <p>Invite up to 12 candidates. Program a custom challenge. Watch their screens and cameras live.</p>
            </div>
            <div class="co-item reveal" data-delay="3">
              <span class="co-icon">🎯</span>
              <strong>Custom challenges</strong>
              <p>Create problems tailored to your stack. Evaluate exactly what you need.</p>
            </div>
            <div class="co-item reveal" data-delay="4">
              <span class="co-icon">✉</span>
              <strong>Direct contact</strong>
              <p>Send requests to any developer. They accept, you get access to their full history.</p>
            </div>
          </div>
          <div class="private-room-banner reveal" data-delay="2">
            <div class="prb-left">
              <span class="em-check-lg">✦</span>
              <div>
                <strong>Private Room — how it works</strong>
                <p>Your company gets a verified profile. Create a session, invite candidates, set the challenge, and run the interview live with up to 12 participants — cameras and screens included.</p>
              </div>
            </div>
            <button class="btn-enterprise" (click)="handleCta('signup')">Get Enterprise access</button>
          </div>
        </div>
      </section>

      <!-- ─── Pricing ────────────────────────────────────────────────── -->
      <section class="pricing" id="pricing">
        <div class="pricing-label reveal">PRICING</div>
        <h2 class="reveal" data-delay="1">Start free.<br/>Upgrade when you mean it.</h2>
        <p class="pricing-sub reveal" data-delay="2">All stats on the platform are visible to everyone. Premium and Enterprise users get more of their own stats — and more visibility to recruiters.</p>
        <div class="plans">
          <div class="plan reveal" data-delay="1">
            <div class="plan-top">
              <span class="plan-name">Free</span>
              <span class="plan-price">$0</span>
            </div>
            <ul>
              <li>Unlimited matches</li>
              <li>Easy & Medium challenges</li>
              <li>ELO rating & public profile</li>
              <li>Last 10 match history</li>
              <li>1v1 game mode</li>
            </ul>
            <button class="btn-plan" (click)="handleCta('signup')">Get started</button>
          </div>
          <div class="plan plan-hero reveal" data-delay="2">
            <div class="plan-glow"></div>
            <div class="plan-top">
              <span class="plan-name">Premium <span class="blue-check">✓</span></span>
              <span class="plan-price">$9<small>/mo</small></span>
            </div>
            <ul>
              <li>Everything in Free</li>
              <li>Hard challenges</li>
              <li>Blue verified badge</li>
              <li>Full match history</li>
              <li>Win rate, avg time, language stats</li>
              <li>Verifiable certificate</li>
              <li>All game modes</li>
            </ul>
            <button class="btn-plan btn-plan-hero" (click)="handleCta('signup')">Upgrade now</button>
          </div>
          <div class="plan plan-enterprise reveal" data-delay="3">
            <div class="plan-glow-em"></div>
            <div class="plan-top">
              <span class="plan-name">Enterprise <span class="em-check">✦</span></span>
              <span class="plan-price">$99<small>/mo</small></span>
            </div>
            <ul>
              <li>Everything in Premium</li>
              <li>Emerald company badge</li>
              <li>Full dev ranking with filters</li>
              <li>View any dev's full history</li>
              <li>Send & receive contact requests</li>
              <li>Private rooms (up to 12)</li>
              <li>Live screens + cameras</li>
              <li>Custom recruiting challenges</li>
              <li>Company logo on platform</li>
            </ul>
            <button class="btn-plan btn-plan-enterprise" (click)="handleCta('signup')">Get Enterprise</button>
          </div>
        </div>
      </section>

      <!-- ─── Footer ─────────────────────────────────────────────────── -->
      <footer class="footer">
        <div class="footer-logo">
          <span class="logo-mark">▸</span>
          <span class="logo-text">matchmood</span>
        </div>
        <p>Compete. Get noticed. Get hired.</p>
        <div class="footer-links">
          <button (click)="handleCta('signup')">Sign up</button>
          <a href="#companies">For companies</a>
          <a href="#pricing">Pricing</a>
        </div>
        <p class="footer-copy">© 2026 Matchmood · Built for developers, by developers.</p>
      </footer>

    </div>
  `,
  styles: [`
    /* ── Hero entrance animations ──────────────────────────────────── */
    @keyframes heroIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes heroInRight { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .hero-eyebrow  { animation: heroIn 0.6s ease both; animation-delay: 0.05s; }
    .hero-title    { animation: heroIn 0.7s ease both; animation-delay: 0.15s; }
    .hero-desc     { animation: heroIn 0.6s ease both; animation-delay: 0.28s; }
    .hero-actions  { animation: heroIn 0.6s ease both; animation-delay: 0.38s; }
    .match-card    { animation: heroInRight 0.7s ease both; animation-delay: 0.2s; }
    .stat-pills    { animation: heroIn 0.6s ease both; animation-delay: 0.35s; }

    /* ── Scroll reveal ─────────────────────────────────────────────── */
    .reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.55s ease, transform 0.55s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
    .reveal[data-delay="1"] { transition-delay: 0.08s; }
    .reveal[data-delay="2"] { transition-delay: 0.16s; }
    .reveal[data-delay="3"] { transition-delay: 0.24s; }
    .reveal[data-delay="4"] { transition-delay: 0.32s; }

    /* ── Scrollbar ─────────────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #22c55e; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #16a34a; }

    /* ── Tema ──────────────────────────────────────────────────────── */
    .landing.dark {
      --bg: #080808; --bg2: #0d0d0d; --bg3: #111;
      --border: #1c1c1c; --border2: #252525;
      --text: #f0f0f0; --muted: #666; --sub: #333; --card: #0f0f0f;
    }
    .landing.light {
      --bg: #f7f7f5; --bg2: #efefec; --bg3: #e8e8e4;
      --border: #ddd; --border2: #ccc;
      --text: #111; --muted: #666; --sub: #bbb; --card: #fff;
    }

    /* ── Base ──────────────────────────────────────────────────────── */
    .landing { background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; min-height: 100vh; }

    /* ── Navbar ────────────────────────────────────────────────────── */
    .nav { display: flex; justify-content: space-between; align-items: center; padding: 18px 48px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); z-index: 100; }
    .nav-logo { display: flex; align-items: center; gap: 8px; }
    .logo-mark { color: #22c55e; font-size: 18px; }
    .logo-text { font-size: 16px; font-weight: 700; letter-spacing: -0.5px; color: var(--text); }
    .nav-right { display: flex; align-items: center; gap: 16px; }
    .nav-link { font-size: 13px; color: var(--muted); transition: color .15s; }
    .nav-link:hover { color: var(--text); }
    .theme-toggle { background: none; border: 1px solid var(--border2); border-radius: 6px; width: 32px; height: 32px; cursor: pointer; font-size: 13px; color: var(--text); transition: border-color .15s; }
    .theme-toggle:hover { border-color: #22c55e; }
    .btn-login { background: none; border: 1px solid var(--border2); color: var(--text); padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: border-color .15s; }
    .btn-login:hover { border-color: #22c55e; color: #22c55e; }
    .btn-signup { background: #22c55e; color: #000; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: background .15s; text-decoration: none; display: inline-flex; align-items: center; }
    .btn-signup:hover { background: #16a34a; }
    .nav-avatar-img { width: 28px; height: 28px; border-radius: 50%; border: 1px solid #333; }
    .nav-username-text { font-size: 13px; color: var(--muted); }

    /* ── Modal ─────────────────────────────────────────────────────── */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .modal { background: var(--card); border: 1px solid var(--border2); border-radius: 16px; padding: 36px 32px; width: 100%; max-width: 420px; position: relative; }
    .modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; transition: color .15s; }
    .modal-close:hover { color: var(--text); }
    .modal-logo { display: flex; align-items: center; gap: 6px; margin-bottom: 24px; }
    .modal-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: var(--text); margin-bottom: 6px; }
    .modal-sub { font-size: 13px; color: var(--muted); margin-bottom: 24px; }

    .btn-github { display: flex; align-items: center; gap: 10px; width: 100%; background: var(--bg2); border: 1px solid var(--border2); border-radius: 10px; padding: 13px 16px; font-size: 14px; font-weight: 700; color: var(--text); cursor: pointer; transition: border-color .15s; position: relative; }
    .btn-github:hover { border-color: #22c55e; }
    .github-rec { position: absolute; right: 12px; font-size: 10px; font-weight: 600; background: rgba(34,197,94,0.15); color: #22c55e; padding: 2px 8px; border-radius: 4px; }

    .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: var(--sub); font-size: 12px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

    .modal-form { display: flex; flex-direction: column; gap: 14px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .form-field input { background: var(--bg2); border: 1px solid var(--border2); border-radius: 8px; padding: 11px 14px; font-size: 14px; color: var(--text); outline: none; transition: border-color .15s; width: 100%; box-sizing: border-box; }
    .form-field input:focus { border-color: #22c55e; }
    .form-field input::placeholder { color: var(--sub); }
    .form-field input.fi-err { border-color: #ef4444; }
    .fi-err-msg { font-size: 11px; color: #ef4444; }

    .pw-wrap { position: relative; display: flex; }
    .pw-wrap input { flex: 1; padding-right: 56px; }
    .pw-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 11px; color: var(--sub); cursor: pointer; font-weight: 600; }

    .pw-strength { display: flex; align-items: center; gap: 4px; margin-top: 6px; }
    .pw-bar { flex: 1; height: 3px; border-radius: 2px; background: var(--border2); transition: background .2s; }
    .pw-bar.s1 { background: #ef4444; }
    .pw-bar.s2 { background: #f59e0b; }
    .pw-bar.s3 { background: #22c55e; }
    .pw-label { font-size: 10px; color: var(--sub); margin-left: 4px; min-width: 36px; }

    .form-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #ef4444; }

    .btn-form-submit { background: #22c55e; color: #000; border: none; border-radius: 8px; padding: 13px; font-size: 14px; font-weight: 800; cursor: pointer; transition: background .15s, opacity .15s; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-form-submit:hover:not(:disabled) { background: #16a34a; }
    .btn-form-submit:disabled { opacity: .6; cursor: not-allowed; }
    .btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,.3); border-top-color: #000; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-switch { font-size: 13px; color: var(--muted); text-align: center; margin-top: 16px; }
    .modal-switch button { background: none; border: none; color: #22c55e; font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; margin-left: 4px; }

    /* ── Hero ──────────────────────────────────────────────────────── */
    .hero { display: grid; grid-template-columns: 1fr 1fr; min-height: calc(100vh - 61px); }
    .hero-left { display: flex; align-items: center; justify-content: center; border-right: 1px solid var(--border); padding: 48px 40px; }
    .hero-left-inner { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 420px; }
    .hero-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #22c55e; margin-bottom: 24px; }
    .hero-title { font-size: clamp(52px, 6vw, 84px); font-weight: 900; line-height: 0.95; letter-spacing: -4px; color: var(--text); margin-bottom: 24px; }
    .hero-title em { color: #22c55e; font-style: normal; }
    .hero-desc { font-size: 16px; color: var(--muted); line-height: 1.6; margin-bottom: 36px; }
    .hero-actions { display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%; }
    .btn-main { background: #22c55e; color: #000; padding: 13px 26px; border-radius: 8px; font-size: 14px; font-weight: 800; letter-spacing: -0.3px; transition: background .15s, transform .1s; border: none; cursor: pointer; width: 100%; }
    .btn-main:hover { background: #16a34a; transform: translateY(-1px); }
    .btn-text { font-size: 13px; color: var(--muted); transition: color .15s; background: none; border: none; cursor: pointer; }
    .btn-text:hover { color: #22c55e; }
    .github-nudge { display: flex; align-items: flex-start; gap: 8px; background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: var(--muted); line-height: 1.5; }

    /* ── Hero right ────────────────────────────────────────────────── */
    .hero-right { padding: 40px 36px; display: flex; flex-direction: column; justify-content: center; gap: 16px; background: var(--bg2); }
    .match-card { background: var(--card); border: 1px solid var(--border2); border-radius: 14px; overflow: hidden; box-shadow: 0 0 60px rgba(34,197,94,0.05); }
    .match-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
    .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: pulse 1.5s infinite; flex-shrink: 0; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .live-text { font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #22c55e; flex: 1; }
    .match-mode-tag { font-size: 10px; font-weight: 800; background: var(--bg3); color: #22c55e; padding: 2px 8px; border-radius: 4px; }
    .match-title { padding: 14px 16px 4px; font-size: 13px; font-weight: 700; color: var(--text); }
    .match-level { padding: 0 16px 14px; font-size: 11px; color: var(--muted); border-bottom: 1px solid var(--border); }
    .match-players { padding: 12px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border); }
    .player { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .player-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; flex-shrink: 0; }
    .p1 { background: linear-gradient(135deg, #22c55e, #16a34a); color: #000; }
    .p2 { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; }
    .player-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .player-name { font-size: 12px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .player-elo { font-size: 10px; color: var(--muted); }
    .player-tests { font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .player-tests.pass { color: #22c55e; }
    .player-tests.fail { color: #3b82f6; }
    .vs-badge { font-size: 9px; font-weight: 900; color: var(--sub); flex-shrink: 0; }
    .blue-check { color: #3b82f6; font-size: 11px; }
    .blue-check-lg { color: #3b82f6; font-size: 20px; font-weight: 900; flex-shrink: 0; }
    .em-check { color: #10b981; font-size: 11px; }
    .em-check-lg { color: #10b981; font-size: 20px; flex-shrink: 0; }
    .code-preview { padding: 14px 16px; background: #060606; font-family: 'Fira Code', monospace; font-size: 11.5px; display: flex; flex-direction: column; gap: 3px; }
    .landing.light .code-preview { background: #1e1e1e; }
    .code-line { color: #555; white-space: nowrap; }
    .code-line.pad { padding-left: 14px; }
    .code-line.pad2 { padding-left: 28px; }
    .code-line.pad3 { padding-left: 42px; }
    .kw { color: #c792ea; }
    .fn { color: #82aaff; }
    .num { color: #f78c6c; }
    .cursor { color: #22c55e; animation: blink 1s step-end infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .stat-pills { display: flex; gap: 10px; }
    .pill { flex: 1; background: var(--card); border: 1px solid var(--border2); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 3px; }
    .pill-accent { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.04); }
    .pill-val { font-size: 20px; font-weight: 900; color: var(--text); letter-spacing: -1px; }
    .pill-accent .pill-val { color: #22c55e; }
    .pill-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }

    /* ── Statement bar ─────────────────────────────────────────────── */
    .statement-bar { display: flex; justify-content: center; align-items: center; gap: 20px; padding: 16px 24px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--bg2); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); flex-wrap: wrap; }
    .bar-dot { color: #22c55e; }

    /* ── Game modes ────────────────────────────────────────────────── */
    .modes { padding: 80px 64px; max-width: 1200px; margin: 0 auto; }
    .modes-label { font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #22c55e; margin-bottom: 16px; }
    .modes-title { font-size: clamp(28px, 4vw, 48px); font-weight: 900; letter-spacing: -2px; color: var(--text); margin-bottom: 40px; }
    .modes-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    .mode-card { background: var(--card); padding: 28px 22px; display: flex; flex-direction: column; gap: 10px; }
    .mode-card.mode-active { background: rgba(34,197,94,0.04); }
    .mode-card.mode-enterprise { background: rgba(16,185,129,0.03); }
    .mode-icon { font-size: 26px; }
    .mode-name { font-size: 15px; font-weight: 800; color: var(--text); }
    .mode-desc { font-size: 13px; color: var(--muted); line-height: 1.5; flex: 1; }
    .mode-tag { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 4px; background: rgba(34,197,94,0.15); color: #22c55e; width: fit-content; }
    .mode-tag.coming { background: var(--bg2); color: var(--muted); }
    .mode-tag.enterprise-tag { background: rgba(16,185,129,0.15); color: #10b981; }

    /* ── How it works ──────────────────────────────────────────────── */
    .how { padding: 80px 64px; max-width: 1200px; margin: 0 auto; }
    .how-label { font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #22c55e; margin-bottom: 48px; }
    .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
    .how-text h2 { font-size: clamp(26px, 3.5vw, 42px); font-weight: 900; letter-spacing: -2px; line-height: 1.1; color: var(--text); margin-bottom: 16px; }
    .how-text p { font-size: 15px; color: var(--muted); line-height: 1.7; margin-bottom: 28px; }
    .badge-row { display: flex; flex-direction: column; gap: 12px; }
    .badge-item { display: flex; align-items: flex-start; gap: 14px; background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
    .badge-item.badge-enterprise { border-color: rgba(16,185,129,0.2); background: rgba(16,185,129,0.03); }
    .badge-item strong { display: block; font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
    .badge-item span { font-size: 12px; color: var(--muted); }
    .how-steps { display: flex; flex-direction: column; gap: 32px; padding-top: 8px; }
    .how-step { display: flex; gap: 18px; align-items: flex-start; }
    .step-n { font-size: 11px; font-weight: 900; color: #22c55e; letter-spacing: 1px; flex-shrink: 0; padding-top: 2px; min-width: 24px; }
    .how-step strong { display: block; font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
    .how-step p { font-size: 13px; color: var(--muted); line-height: 1.6; }

    /* ── Companies ─────────────────────────────────────────────────── */
    .companies { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 80px 64px; }
    .companies-inner { max-width: 1100px; margin: 0 auto; }
    .companies-tag { font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #10b981; margin-bottom: 20px; }
    .companies h2 { font-size: clamp(26px, 4vw, 48px); font-weight: 900; letter-spacing: -2px; line-height: 1.05; color: var(--text); margin-bottom: 16px; }
    .companies-sub { font-size: 15px; color: var(--muted); line-height: 1.6; max-width: 560px; margin-bottom: 40px; }
    .companies-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
    .co-item { background: var(--card); padding: 22px 18px; }
    .co-icon { display: block; font-size: 20px; margin-bottom: 10px; }
    .co-item strong { display: block; font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
    .co-item p { font-size: 12px; color: var(--muted); line-height: 1.5; }
    .private-room-banner { display: flex; align-items: center; gap: 24px; background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 24px 28px; flex-wrap: wrap; }
    .prb-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 260px; }
    .prb-left strong { display: block; font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
    .prb-left p { font-size: 13px; color: var(--muted); line-height: 1.6; }
    .btn-enterprise { background: #10b981; color: #000; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; border: none; transition: background .15s; white-space: nowrap; flex-shrink: 0; }
    .btn-enterprise:hover { background: #059669; }

    /* ── Pricing ───────────────────────────────────────────────────── */
    .pricing { padding: 80px 64px; max-width: 1200px; margin: 0 auto; }
    .pricing-label { font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #22c55e; margin-bottom: 20px; }
    .pricing h2 { font-size: clamp(28px, 4vw, 48px); font-weight: 900; letter-spacing: -2px; line-height: 1.05; color: var(--text); margin-bottom: 12px; }
    .pricing-sub { font-size: 14px; color: var(--muted); line-height: 1.6; max-width: 540px; margin-bottom: 48px; }
    .plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .plan { background: var(--card); padding: 32px 28px; position: relative; }
    .plan-hero { background: var(--bg2); }
    .plan-enterprise { background: rgba(16,185,129,0.02); }
    .plan-glow { position: absolute; inset: 0; box-shadow: inset 0 0 0 1px #22c55e; pointer-events: none; }
    .plan-glow-em { position: absolute; inset: 0; box-shadow: inset 0 0 0 1px #10b981; pointer-events: none; }
    .plan-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .plan-name { font-size: 15px; font-weight: 800; color: var(--text); }
    .plan-price { font-size: 30px; font-weight: 900; color: var(--text); letter-spacing: -1px; }
    .plan-price small { font-size: 12px; font-weight: 400; color: var(--muted); }
    .plan ul { list-style: none; display: flex; flex-direction: column; gap: 9px; margin-bottom: 28px; }
    .plan li { font-size: 13px; color: var(--muted); padding-left: 16px; position: relative; line-height: 1.4; }
    .plan li::before { content: '✓'; position: absolute; left: 0; color: #22c55e; font-weight: 700; font-size: 10px; top: 2px; }
    .plan-enterprise li::before { color: #10b981; }
    .btn-plan { display: block; width: 100%; text-align: center; padding: 11px; border: 1px solid var(--border2); border-radius: 8px; font-size: 13px; font-weight: 700; color: var(--muted); cursor: pointer; background: none; transition: border-color .15s, color .15s; }
    .btn-plan:hover { border-color: #22c55e; color: #22c55e; }
    .btn-plan-hero { background: #22c55e; color: #000; border-color: #22c55e; }
    .btn-plan-hero:hover { background: #16a34a; border-color: #16a34a; color: #000; }
    .btn-plan-enterprise { background: #10b981; color: #000; border-color: #10b981; }
    .btn-plan-enterprise:hover { background: #059669; border-color: #059669; color: #000; }

    /* ── Footer ────────────────────────────────────────────────────── */
    .footer { border-top: 1px solid var(--border); padding: 40px 64px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
    .footer-logo { display: flex; align-items: center; gap: 8px; }
    .footer p { font-size: 13px; color: var(--muted); }
    .footer-links { display: flex; gap: 24px; }
    .footer-links a, .footer-links button { font-size: 13px; color: var(--muted); transition: color .15s; background: none; border: none; cursor: pointer; }
    .footer-links a:hover, .footer-links button:hover { color: #22c55e; }
    .footer-copy { font-size: 11px; color: var(--sub) !important; }

    /* ── Responsive ────────────────────────────────────────────────── */
    @media (max-width: 960px) {
      .hero { grid-template-columns: 1fr; }
      .hero-left { border-right: none; border-bottom: 1px solid var(--border); padding: 48px 24px; }
      .hero-right { padding: 32px 24px; }
      .how { padding: 60px 24px; }
      .how-grid { grid-template-columns: 1fr; gap: 40px; }
      .modes { padding: 60px 24px; }
      .modes-grid { grid-template-columns: 1fr 1fr; }
      .companies { padding: 60px 24px; }
      .companies-grid { grid-template-columns: 1fr 1fr; }
      .pricing { padding: 60px 24px; }
      .plans { grid-template-columns: 1fr; }
      .nav { padding: 14px 20px; }
      .nav-link { display: none; }
    }
  `],
})
export class HomeComponent implements OnInit, AfterViewInit {
  loginUrl = `${environment.apiUrl}/auth/github`;
  theme    = signal<'dark' | 'light'>('dark');
  modal    = signal<ModalMode>(null);

  // Form state
  formUsername = '';
  formEmail    = '';
  formPassword = '';
  formLoading  = signal(false);
  formError    = signal<string | null>(null);
  showPassword = signal(false);
  fieldErrors  = signal<Record<string, string>>({});

  // Password strength: 0-3
  pwStrength = signal(0);
  pwLabel    = signal('');

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('mm_theme') as 'dark' | 'light' | null;
    if (saved) this.theme.set(saved);
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  handleCta(mode: ModalMode): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.modal.set(mode);
    }
  }

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('mm_theme', next);
  }

  openModal(mode: ModalMode): void { this.modal.set(mode); }

  closeModal(): void {
    this.modal.set(null);
    this.resetForm();
  }

  switchTo(mode: ModalMode): void {
    this.resetForm();
    this.modal.set(mode);
  }

  fieldError(field: string): string | null {
    return this.fieldErrors()[field] ?? null;
  }

  onPasswordInput(): void {
    const p = this.formPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) || /[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p) && p.length >= 10) score++;
    this.pwStrength.set(score);
    this.pwLabel.set(['', 'Weak', 'Fair', 'Strong'][score]);
  }

  submitForm(e: Event): void {
    e.preventDefault();
    this.formError.set(null);
    this.fieldErrors.set({});

    if (this.modal() === 'signup') {
      this.doRegister();
    } else {
      this.doLogin();
    }
  }

  private doRegister(): void {
    const errors: Record<string, string> = {};
    if (!this.formEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formEmail))
      errors['email'] = 'Enter a valid email';
    if (!this.formPassword || this.formPassword.length < 8)
      errors['password'] = 'Minimum 8 characters';

    if (Object.keys(errors).length) { this.fieldErrors.set(errors); return; }

    this.formLoading.set(true);
    this.authService.register(this.formEmail, this.formPassword).subscribe({
      next:  () => { this.formLoading.set(false); },
      error: (err) => {
        this.formLoading.set(false);
        const msg: string = err?.error?.error ?? 'Something went wrong. Try again.';
        // Map known server errors to specific fields
        if (msg.toLowerCase().includes('username')) this.fieldErrors.update(f => ({ ...f, username: msg }));
        else if (msg.toLowerCase().includes('email'))  this.fieldErrors.update(f => ({ ...f, email: msg }));
        else this.formError.set(msg);
      },
    });
  }

  private doLogin(): void {
    const errors: Record<string, string> = {};
    if (!this.formEmail)    errors['email']    = 'Email is required';
    if (!this.formPassword) errors['password'] = 'Password is required';
    if (Object.keys(errors).length) { this.fieldErrors.set(errors); return; }

    this.formLoading.set(true);
    this.authService.login(this.formEmail, this.formPassword).subscribe({
      next:  () => { this.formLoading.set(false); },
      error: (err) => {
        this.formLoading.set(false);
        const msg: string = err?.error?.error ?? 'Something went wrong. Try again.';
        this.formError.set(msg);
      },
    });
  }

  private resetForm(): void {
    this.formUsername = '';
    this.formEmail    = '';
    this.formPassword = '';
    this.formError.set(null);
    this.fieldErrors.set({});
    this.formLoading.set(false);
    this.showPassword.set(false);
    this.pwStrength.set(0);
    this.pwLabel.set('');
  }
}
