import { Component, signal, OnInit, AfterViewInit, OnDestroy, ElementRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type ModalMode = 'login' | 'signup' | null;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="landing" [class.anim]="animOn()">
      <!-- ambient grid + cursor glow -->
      <div class="bg-grid"></div>
      <div class="cursor-glow" #glow></div>

      <!-- ─── Nav ─────────────────────────────────────────────────────── -->
      <nav class="nav" #nav>
        <a class="brand" (click)="scrollTop()">
          <span class="mark" [innerHTML]="markSvg"></span>
          <span class="wordmark">match<span class="lime">mood</span></span>
        </a>
        <div class="nav-links">
          <a (click)="scrollTo('modes')">modes</a>
          <a (click)="scrollTo('companies')">for companies</a>
          <a (click)="scrollTo('pricing')">pricing</a>
        </div>
        <div class="nav-cta">
          @if (authService.isLoggedIn()) {
            <span class="nav-user">{{ authService.user()?.username }}</span>
            <a routerLink="/dashboard" class="btn btn-lime magnetic">Dashboard →</a>
          } @else {
            <button class="btn btn-ghost" (click)="openModal('login')">log in</button>
            <button class="btn btn-lime magnetic" (click)="handleCta('signup')">Enter arena</button>
          }
        </div>
      </nav>

      <!-- ─── Hero ────────────────────────────────────────────────────── -->
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow" #eyebrow>
            ranked 1v1 algorithm duels · ai-generated · verified elo
          </div>
          <h1 class="title">
            <span class="ln" #t1>Code is the</span>
            <span class="ln" #t2>new</span>
            <span class="ln lime scramble" #t3>résumé.</span>
          </h1>
          <p class="lede">
            Real-time battles on problems no one has seen before. Build an ELO
            that can't be faked, and get discovered by the companies that hire on skill — not on buzzwords.
          </p>
          <div class="actions" #actions>
            <button class="btn btn-lime btn-lg magnetic" (click)="handleCta('signup')">Enter the arena</button>
            <button class="btn btn-line btn-lg" (click)="scrollTo('companies')">I recruit developers →</button>
          </div>
          <div class="trust" #trust>
            <span><b class="lime">247</b> devs online</span>
            <span class="sep">/</span>
            <span><b>1,240</b> duels today</span>
            <span class="sep">/</span>
            <span><b>38s</b> fastest solve</span>
          </div>
        </div>

        <!-- live match terminal -->
        <div class="stage" #stage>
          <div class="term">
            <div class="term-bar">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              <span class="term-title">arena://live · 1v1</span>
              <span class="live"><i></i>LIVE</span>
            </div>
            <div class="term-body">
              <div class="prob">
                <span class="prob-title">Longest Substring Without Repeating</span>
                <span class="prob-meta">MEDIUM · JS · <b class="lime">04:12</b> left</span>
              </div>
              <div class="duel">
                <div class="fighter you">
                  <div class="ava">R</div>
                  <div class="f-info"><span class="f-name">robert <b class="chk">✓</b></span><span class="f-elo">1025 elo</span></div>
                  <div class="f-bar"><i class="fill lime" style="width:66%"></i></div>
                  <span class="f-score lime">2/3</span>
                </div>
                <div class="vs">VS</div>
                <div class="fighter rival">
                  <div class="ava mag">M</div>
                  <div class="f-info"><span class="f-name">mike</span><span class="f-elo">975 elo</span></div>
                  <div class="f-bar"><i class="fill mag" style="width:33%"></i></div>
                  <span class="f-score mag">1/3</span>
                </div>
              </div>
              <pre class="code"><span class="cl"><span class="k">function</span> <span class="fn">lengthOfLongest</span>(s) {{ '{' }}</span>
<span class="cl">  <span class="k">const</span> seen = <span class="k">new</span> <span class="ty">Map</span>();</span>
<span class="cl">  <span class="k">let</span> l = <span class="n">0</span>, max = <span class="n">0</span>;</span>
<span class="cl">  <span class="k">for</span> (<span class="k">let</span> r = <span class="n">0</span>; r &lt; s.length; r++) {{ '{' }}</span>
<span class="cl">    <span class="k">if</span> (seen.has(s[r])) l = max(l, seen.get(s[r])+<span class="n">1</span>);</span>
<span class="cl">    seen.set(s[r], r); max = max(max, r-l+<span class="n">1</span>);</span>
<span class="cl">  {{ '}' }}</span>
<span class="cl">  <span class="k">return</span> max;<span class="caret">▍</span></span>
<span class="cl">{{ '}' }}</span></pre>
            </div>
          </div>
          <div class="chip chip-1"><b class="lime">+25</b> elo on win</div>
          <div class="chip chip-2"><b>AI</b> writes every problem</div>
        </div>
      </section>

      <!-- ─── Ticker ──────────────────────────────────────────────────── -->
      <div class="ticker">
        <div class="ticker-track">
          @for (i of [1,2]; track i) {
            <span>NO FAKE PROBLEMS</span><span class="star">✳</span>
            <span>NO MEMORIZED SOLUTIONS</span><span class="star">✳</span>
            <span>NO WHITEBOARD THEATER</span><span class="star">✳</span>
            <span>JUST YOUR CODE</span><span class="star">✳</span>
            <span>PROVEN IN 3 MINUTES</span><span class="star">✳</span>
          }
        </div>
      </div>

      <!-- ─── Modes ───────────────────────────────────────────────────── -->
      <section class="sec modes" id="modes">
        <div class="sec-head">
          <span class="kicker" data-reveal>// game modes</span>
          <h2 data-reveal>Pick your battle.</h2>
        </div>
        <div class="grid-4">
          <div class="card mode on" data-reveal>
            <div class="m-ico">⚔</div>
            <div class="m-name">1v1</div>
            <p>Classic duel. You versus one opponent. Best solution takes the ELO.</p>
            <span class="tag live-tag">available now</span>
          </div>
          <div class="card mode" data-reveal>
            <div class="m-ico">✦</div>
            <div class="m-name">Free for All</div>
            <p>Up to 4 devs, one problem. Slowest to solve gets eliminated.</p>
            <span class="tag">coming soon</span>
          </div>
          <div class="card mode" data-reveal>
            <div class="m-ico">⧉</div>
            <div class="m-name">2v2</div>
            <p>Team up, split the problem, win together — or lose together.</p>
            <span class="tag">coming soon</span>
          </div>
          <div class="card mode ent" data-reveal>
            <div class="m-ico">◆</div>
            <div class="m-name">Private Room</div>
            <p>Company-hosted session. Up to 12 candidates, live screens, real report.</p>
            <span class="tag ent-tag">enterprise</span>
          </div>
        </div>
      </section>

      <!-- ─── How ─────────────────────────────────────────────────────── -->
      <section class="sec how">
        <div class="how-left">
          <span class="kicker" data-reveal>// for developers</span>
          <h2 data-reveal>Three minutes to prove<br>what your CV can't.</h2>
          <p class="how-lede" data-reveal>
            Every match is a fresh problem generated the instant you're paired.
            You can't Google it. You can't memorize it. Only real skill compounds.
          </p>
          <button class="btn btn-lime btn-lg magnetic" data-reveal (click)="handleCta('signup')">Start for free</button>
        </div>
        <div class="how-steps">
          <div class="step" data-reveal>
            <span class="s-n">01</span>
            <div><b>Sign in with GitHub</b><p>One click. Your coding identity becomes your profile — recruiters find you by performance, not a bio.</p></div>
          </div>
          <div class="step" data-reveal>
            <span class="s-n">02</span>
            <div><b>Get matched instantly</b><p>Paired with a dev at your level. An AI writes a problem that has never existed before, just for this match.</p></div>
          </div>
          <div class="step" data-reveal>
            <span class="s-n">03</span>
            <div><b>Your rating grows publicly</b><p>ELO, win rate, solve time — public and verified. Every result is signed by a real match.</p></div>
          </div>
        </div>
      </section>

      <!-- ─── Stats ───────────────────────────────────────────────────── -->
      <section class="sec stats" #statsSec>
        <div class="stat"><span class="s-val" data-count="1240">0</span><span class="s-lab">duels today</span></div>
        <div class="stat"><span class="s-val lime" data-count="247">0</span><span class="s-lab">devs online now</span></div>
        <div class="stat"><span class="s-val" data-count="38" data-suffix="s">0</span><span class="s-lab">fastest solve</span></div>
        <div class="stat"><span class="s-val mag" data-count="100" data-suffix="%">0</span><span class="s-lab">verified results</span></div>
      </section>

      <!-- ─── Companies ───────────────────────────────────────────────── -->
      <section class="sec companies" id="companies">
        <div class="co-grid">
          <div class="co-copy">
            <span class="kicker" data-reveal>// for companies</span>
            <h2 data-reveal>Stop reading résumés.<br>Watch them <span class="lime">code.</span></h2>
            <p data-reveal>
              Host private rooms, drop in a challenge, and watch candidates solve in real time —
              screens, timers, and a signed report you can trust. Hire on evidence.
            </p>
            <div class="badges" data-reveal>
              <div class="badge"><b class="chk">✓</b><div><b>Premium badge</b><span>Verified performance, shown on every profile</span></div></div>
              <div class="badge ent"><b class="dia">◆</b><div><b>Enterprise badge</b><span>Company-level verification & top recruiter visibility</span></div></div>
            </div>
          </div>
          <div class="co-card" data-reveal>
            <div class="rep-bar"><span>report://candidate_0472</span><span class="rep-ok">SIGNED</span></div>
            <div class="rep-row"><span>Result</span><b class="lime">SOLVED · 2/2 tests</b></div>
            <div class="rep-row"><span>Solve time</span><b>1m 47s</b></div>
            <div class="rep-row"><span>ELO applied</span><b class="lime">+25 → 1050</b></div>
            <div class="rep-row"><span>Integrity</span><b>no paste · no tab-switch</b></div>
            <div class="rep-foot">every field is machine-verified — nothing self-reported.</div>
          </div>
        </div>
      </section>

      <!-- ─── Pricing ─────────────────────────────────────────────────── -->
      <section class="sec pricing" id="pricing">
        <div class="sec-head center">
          <span class="kicker" data-reveal>// pricing</span>
          <h2 data-reveal>Start free. Rank up when you're ready.</h2>
        </div>
        <div class="grid-3">
          <div class="card price" data-reveal>
            <span class="p-name">Free</span>
            <div class="p-cost"><b>$0</b></div>
            <ul><li>Ranked 1v1 duels</li><li>Public ELO profile</li><li>Last 5 matches</li></ul>
            <button class="btn btn-line full" (click)="handleCta('signup')">Get started</button>
          </div>
          <div class="card price feat" data-reveal>
            <span class="p-flag">most popular</span>
            <span class="p-name">Premium</span>
            <div class="p-cost"><b>$9</b><span>/mo</span></div>
            <ul><li>Everything in Free</li><li class="on">Verified badge <b class="chk">✓</b></li><li>Full match history & stats</li><li>Recruiter visibility</li></ul>
            <button class="btn btn-lime full magnetic" (click)="handleCta('signup')">Go Premium</button>
          </div>
          <div class="card price" data-reveal>
            <span class="p-name">Enterprise</span>
            <div class="p-cost"><b>$99</b><span>/mo</span></div>
            <ul><li>Everything in Premium</li><li class="on">Private rooms <b class="dia">◆</b></li><li>Live candidate reports</li><li>Team dashboard</li></ul>
            <button class="btn btn-line full" (click)="handleCta('signup')">Talk to us</button>
          </div>
        </div>
      </section>

      <!-- ─── Final CTA ───────────────────────────────────────────────── -->
      <section class="sec final">
        <div class="final-mark" [innerHTML]="markSvg"></div>
        <h2 data-reveal>Your next opponent<br>is already searching.</h2>
        <button class="btn btn-lime btn-xl magnetic" (click)="handleCta('signup')">Enter the arena</button>
        <span class="final-sub" data-reveal>free · sign in with github · 3 minutes to your first ELO</span>
      </section>

      <!-- ─── Footer ──────────────────────────────────────────────────── -->
      <footer class="foot">
        <div class="foot-brand">
          <span class="mark sm" [innerHTML]="markSvg"></span>
          <span class="wordmark">match<span class="lime">mood</span></span>
        </div>
        <span class="foot-note">code is the new résumé. © MatchMood</span>
      </footer>

      <!-- ─── Auth modal ──────────────────────────────────────────────── -->
      @if (modal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="closeModal()">✕</button>
            <div class="modal-brand">
              <span class="mark" [innerHTML]="markSvg"></span>
              <span class="wordmark">match<span class="lime">mood</span></span>
            </div>
            <h2 class="modal-title">{{ modal() === 'login' ? 'Welcome back.' : 'Join the arena.' }}</h2>
            <p class="modal-sub">{{ modal() === 'login' ? 'Log in and get back to the ladder.' : 'Create your account and start competing.' }}</p>

            <a [href]="loginUrl" class="btn-github">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub <span class="rec">recommended</span>
            </a>
            <div class="divider"><span>or</span></div>

            <form class="modal-form" (submit)="submitForm($event)">
              <div class="field">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" autocomplete="email"
                       [(ngModel)]="formEmail" name="email" [class.err]="fieldError('email')" />
                @if (fieldError('email')) { <span class="err-msg">{{ fieldError('email') }}</span> }
              </div>
              <div class="field">
                <label>Password</label>
                <div class="pw">
                  <input [type]="showPassword() ? 'text' : 'password'" placeholder="••••••••"
                         [autocomplete]="modal()==='signup' ? 'new-password' : 'current-password'"
                         [(ngModel)]="formPassword" name="password" (ngModelChange)="onPasswordInput()"
                         [class.err]="fieldError('password')" />
                  <button type="button" class="pw-t" (click)="showPassword.set(!showPassword())">{{ showPassword() ? 'hide' : 'show' }}</button>
                </div>
                @if (modal() === 'signup') {
                  <div class="pw-str">
                    <i [class.a]="pwStrength()>=1" [class.b]="pwStrength()>=2" [class.c]="pwStrength()>=3"></i>
                    <i [class.b]="pwStrength()>=2" [class.c]="pwStrength()>=3"></i>
                    <i [class.c]="pwStrength()>=3"></i>
                    <span>{{ pwLabel() }}</span>
                  </div>
                }
                @if (fieldError('password')) { <span class="err-msg">{{ fieldError('password') }}</span> }
              </div>
              @if (formError()) { <div class="form-err">{{ formError() }}</div> }
              <button type="submit" class="btn btn-lime full" [disabled]="formLoading()">
                @if (formLoading()) { <span class="spin"></span> }
                {{ modal() === 'login' ? 'Log in' : 'Create account' }}
              </button>
            </form>
            <p class="modal-switch">
              @if (modal() === 'login') { New here? <button (click)="switchTo('signup')">Sign up</button> }
              @else { Already have an account? <button (click)="switchTo('login')">Log in</button> }
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { --base:#0A0B0D; --surf:#101215; --surf2:#15181d; --line:#20242b; --line2:#2b313a;
      --txt:#EDEDED; --mut:#8b939c; --dim:#5a6169; --lime:#C6FF3D; --mag:#FF3D77; --grn:#22C55E;
      --mono:'JetBrains Mono',ui-monospace,monospace; --disp:'Space Grotesk',system-ui,sans-serif; }

    .landing { background:var(--base); color:var(--txt); font-family:var(--disp); overflow-x:clip; position:relative; }
    .lime{color:var(--lime)} .mag{color:var(--mag)}
    .kicker{font-family:var(--mono);font-size:12px;letter-spacing:.1em;color:var(--lime);text-transform:uppercase}

    /* ambient */
    .bg-grid{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.5;
      background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);
      background-size:64px 64px;mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,#000 0%,transparent 75%)}
    .cursor-glow{position:fixed;top:0;left:0;width:520px;height:520px;border-radius:50%;pointer-events:none;z-index:0;
      background:radial-gradient(circle,rgba(198,255,61,.10),transparent 60%);transform:translate(-50%,-50%);will-change:transform}
    .landing > :not(.bg-grid):not(.cursor-glow):not(.modal-backdrop){position:relative;z-index:1}

    /* buttons */
    .btn{font-family:var(--disp);font-weight:600;font-size:14px;border:1px solid transparent;border-radius:10px;
      padding:11px 18px;cursor:pointer;transition:transform .12s,background .15s,border-color .15s,color .15s;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:8px;line-height:1}
    .btn-lime{background:var(--lime);color:#0A0B0D;box-shadow:0 0 0 rgba(198,255,61,0)}
    .btn-lime:hover{box-shadow:0 8px 30px rgba(198,255,61,.28)}
    .btn-ghost{background:transparent;color:var(--mut)} .btn-ghost:hover{color:var(--txt)}
    .btn-line{background:transparent;border-color:var(--line2);color:var(--txt)} .btn-line:hover{border-color:var(--lime);color:var(--lime)}
    .btn-lg{padding:15px 26px;font-size:15px} .btn-xl{padding:20px 40px;font-size:18px;border-radius:12px}
    .btn.full{width:100%;justify-content:center}

    /* nav */
    .nav{position:sticky;top:0;display:flex;align-items:center;gap:28px;padding:18px 48px;
      background:rgba(10,11,13,.72);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);z-index:50}
    .brand{display:flex;align-items:center;gap:11px;cursor:pointer;user-select:none}
    .mark{display:flex;width:34px;height:34px} .mark.sm{width:26px;height:26px} .mark svg{width:100%;height:100%}
    .wordmark{font-family:var(--mono);font-weight:700;font-size:20px;letter-spacing:-.02em;display:flex;align-items:center}
    @keyframes blink{50%{opacity:0}}
    .nav-links{display:flex;gap:24px;margin-left:8px}
    .nav-links a{font-family:var(--mono);font-size:13px;color:var(--mut);cursor:pointer;transition:color .15s}
    .nav-links a:hover{color:var(--lime)}
    .nav-cta{display:flex;align-items:center;gap:12px;margin-left:auto}
    .nav-user{font-family:var(--mono);font-size:13px;color:var(--mut)}

    /* hero */
    .hero{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;
      max-width:1240px;margin:0 auto;padding:80px 48px 90px}
    .eyebrow{font-family:var(--mono);font-size:13px;color:var(--mut);margin-bottom:26px;letter-spacing:.01em}
    .title{font-size:clamp(52px,7.2vw,104px);line-height:.9;letter-spacing:-.04em;font-weight:700;margin-bottom:28px}
    .title .ln{display:block;overflow:hidden}
    .lede{font-size:18px;line-height:1.6;color:var(--mut);max-width:520px;margin-bottom:34px}
    .actions{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:34px}
    .trust{font-family:var(--mono);font-size:13px;color:var(--dim);display:flex;gap:14px;align-items:center}
    .trust b{color:var(--txt)} .trust .sep{color:var(--line2)}

    /* live terminal */
    .stage{position:relative}
    .term{background:linear-gradient(180deg,#12151a,#0e1116);border:1px solid var(--line2);border-radius:16px;
      overflow:hidden;box-shadow:0 40px 120px -40px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.02) inset}
    .term-bar{display:flex;align-items:center;gap:7px;padding:12px 16px;border-bottom:1px solid var(--line);background:#0d1014}
    .term-bar .dot{width:10px;height:10px;border-radius:50%;background:#2b313a}
    .term-title{font-family:var(--mono);font-size:12px;color:var(--dim);margin-left:8px}
    .live{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--mag);display:flex;align-items:center;gap:6px;letter-spacing:.12em}
    .live i{width:7px;height:7px;border-radius:50%;background:var(--mag);box-shadow:0 0 10px var(--mag);animation:pulse 1.3s infinite}
    @keyframes pulse{50%{opacity:.35}}
    .term-body{padding:20px}
    .prob{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:18px}
    .prob-title{font-weight:600;font-size:15px} .prob-meta{font-family:var(--mono);font-size:11px;color:var(--dim);white-space:nowrap}
    .duel{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;margin-bottom:20px}
    .fighter{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;background:#0e1116;border:1px solid var(--line);border-radius:11px;padding:10px}
    .ava{width:34px;height:34px;border-radius:8px;display:grid;place-items:center;font-family:var(--mono);font-weight:700;background:rgba(198,255,61,.12);color:var(--lime)}
    .ava.mag{background:rgba(255,61,119,.12);color:var(--mag)}
    .f-info{display:flex;flex-direction:column;gap:2px;min-width:0}
    .f-name{font-size:13px;font-weight:600;display:flex;align-items:center;gap:5px} .chk{color:#3b82f6;font-size:11px}
    .f-elo{font-family:var(--mono);font-size:11px;color:var(--dim)}
    .f-bar{grid-column:1/-1;height:4px;border-radius:3px;background:#1b1f26;overflow:hidden}
    .f-bar .fill{display:block;height:100%;border-radius:3px} .fill.lime{background:var(--lime)} .fill.mag{background:var(--mag)}
    .f-score{grid-row:1;font-family:var(--mono);font-weight:700;font-size:13px}
    .vs{font-family:var(--mono);font-weight:700;font-size:12px;color:var(--dim);letter-spacing:.1em}
    .code{font-family:var(--mono);font-size:12.5px;line-height:1.65;color:#c9d1d9;background:#0b0e12;border:1px solid var(--line);border-radius:11px;padding:14px 16px;margin:0;overflow:hidden}
    .code .k{color:#ff7b9c} .code .fn{color:var(--lime)} .code .n{color:#f0b849} .code .ty{color:#7dd3fc}
    .code .caret{color:var(--lime);animation:blink 1.1s steps(1) infinite}
    .chip{position:absolute;font-family:var(--mono);font-size:12px;background:var(--surf);border:1px solid var(--line2);
      border-radius:10px;padding:9px 13px;box-shadow:0 12px 30px -12px rgba(0,0,0,.8)}
    .chip b{font-weight:700} .chip-1{top:-16px;right:-14px} .chip-2{bottom:-16px;left:-16px}

    /* ticker */
    .ticker{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surf);overflow:hidden;padding:16px 0}
    .ticker-track{display:flex;gap:26px;align-items:center;white-space:nowrap;width:max-content;animation:scroll 26s linear infinite;font-family:var(--mono);font-weight:600;font-size:14px;letter-spacing:.06em;color:var(--txt)}
    .ticker-track .star{color:var(--lime)}
    @keyframes scroll{to{transform:translateX(-50%)}}

    /* sections */
    .sec{max-width:1240px;margin:0 auto;padding:100px 48px}
    .sec-head{margin-bottom:48px} .sec-head.center{text-align:center}
    .sec h2{font-size:clamp(34px,4.6vw,60px);line-height:1.02;letter-spacing:-.03em;font-weight:700;margin-top:14px}
    .card{background:var(--surf);border:1px solid var(--line);border-radius:16px;padding:26px;transition:transform .18s,border-color .18s}
    .card:hover{transform:translateY(-4px);border-color:var(--line2)}
    .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
    .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}

    .mode .m-ico{font-size:26px;margin-bottom:16px} .mode .m-name{font-size:20px;font-weight:700;margin-bottom:8px}
    .mode p{color:var(--mut);font-size:14px;line-height:1.55;margin-bottom:20px}
    .tag{font-family:var(--mono);font-size:11px;color:var(--dim);border:1px solid var(--line2);border-radius:20px;padding:5px 11px}
    .live-tag{color:var(--lime);border-color:rgba(198,255,61,.35)}
    .ent-tag{color:#7dd3fc;border-color:rgba(125,211,252,.3)}
    .mode.on{border-color:rgba(198,255,61,.35);box-shadow:0 0 40px -20px var(--lime) inset}
    .mode.ent{border-color:rgba(125,211,252,.22)}

    .how{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start}
    .how-lede{color:var(--mut);font-size:17px;line-height:1.6;margin:20px 0 30px;max-width:440px}
    .how-steps{display:flex;flex-direction:column;gap:14px}
    .step{display:grid;grid-template-columns:auto 1fr;gap:18px;background:var(--surf);border:1px solid var(--line);border-radius:14px;padding:22px}
    .s-n{font-family:var(--mono);font-weight:700;font-size:20px;color:var(--lime)}
    .step b{font-size:17px} .step p{color:var(--mut);font-size:14px;line-height:1.55;margin-top:6px}

    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:56px 48px;max-width:1240px}
    .stat{text-align:center} .s-val{display:block;font-family:var(--mono);font-weight:700;font-size:clamp(40px,5vw,64px);letter-spacing:-.03em;line-height:1}
    .s-lab{font-family:var(--mono);font-size:12px;color:var(--dim);text-transform:uppercase;letter-spacing:.08em}

    .companies .co-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
    .co-copy p{color:var(--mut);font-size:17px;line-height:1.6;margin:18px 0 26px;max-width:460px}
    .badges{display:flex;flex-direction:column;gap:12px}
    .badge{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;background:var(--surf);border:1px solid var(--line);border-radius:12px;padding:16px}
    .badge b.chk{color:#3b82f6;font-size:20px} .badge b.dia{color:#7dd3fc;font-size:18px}
    .badge div b{display:block;font-size:15px} .badge span{color:var(--mut);font-size:13px}
    .co-card{background:#0d1014;border:1px solid var(--line2);border-radius:16px;padding:22px;font-family:var(--mono);box-shadow:0 40px 120px -50px #000}
    .rep-bar{display:flex;justify-content:space-between;font-size:12px;color:var(--dim);padding-bottom:14px;border-bottom:1px solid var(--line);margin-bottom:14px}
    .rep-ok{color:var(--lime)} .rep-row{display:flex;justify-content:space-between;padding:9px 0;font-size:13px;color:var(--mut)}
    .rep-row b{color:var(--txt)} .rep-foot{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);font-size:11px;color:var(--dim)}

    .pricing .p-name{font-family:var(--mono);font-size:13px;color:var(--mut);text-transform:uppercase;letter-spacing:.08em}
    .p-cost{margin:12px 0 20px} .p-cost b{font-size:44px;font-weight:700;letter-spacing:-.03em} .p-cost span{color:var(--dim);font-family:var(--mono);font-size:14px}
    .price ul{list-style:none;margin:0 0 22px;padding:18px 0 0;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:11px}
    .price li{font-size:14px;color:var(--mut);display:flex;align-items:center;gap:7px} .price li.on{color:var(--txt)}
    .price li .chk{color:#3b82f6} .price li .dia{color:#7dd3fc}
    .price.feat{border-color:rgba(198,255,61,.4);position:relative;box-shadow:0 0 60px -30px var(--lime)}
    .p-flag{position:absolute;top:-11px;left:26px;background:var(--lime);color:#0A0B0D;font-family:var(--mono);font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px}

    .final{text-align:center;display:flex;flex-direction:column;align-items:center;gap:26px;padding:120px 48px}
    .final-mark{width:64px;height:64px} .final-mark svg{width:100%;height:100%}
    .final h2{font-size:clamp(38px,5.6vw,76px);line-height:1;letter-spacing:-.03em}
    .final-sub{font-family:var(--mono);font-size:13px;color:var(--dim)}

    .foot{display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:1240px;margin:0 auto;padding:32px 48px;border-top:1px solid var(--line);flex-wrap:wrap}
    .foot-brand{display:flex;align-items:center;gap:10px} .foot-brand .wordmark{font-size:16px}
    .foot-note{font-family:var(--mono);font-size:12px;color:var(--dim)}

    /* reveal — only hidden once JS marks .anim, so content stays visible if JS fails */
    .landing.anim [data-reveal]{opacity:0;transform:translateY(22px)}
    .landing.anim [data-reveal].in{opacity:1;transform:none;transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}

    /* modal */
    .modal-backdrop{position:fixed;inset:0;background:rgba(6,7,9,.8);backdrop-filter:blur(6px);display:grid;place-items:center;z-index:100;padding:20px;animation:fade .2s}
    @keyframes fade{from{opacity:0}}
    .modal{position:relative;width:100%;max-width:420px;background:var(--surf);border:1px solid var(--line2);border-radius:18px;padding:34px;box-shadow:0 40px 120px -30px #000}
    .modal-close{position:absolute;top:16px;right:16px;background:transparent;border:none;color:var(--dim);cursor:pointer;font-size:15px}
    .modal-close:hover{color:var(--txt)}
    .modal-brand{display:flex;align-items:center;gap:10px;margin-bottom:22px} .modal-brand .mark{width:30px;height:30px} .modal-brand .wordmark{font-size:18px}
    .modal-title{font-size:26px;letter-spacing:-.02em;margin-bottom:6px} .modal-sub{color:var(--mut);font-size:14px;margin-bottom:22px}
    .btn-github{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:var(--txt);color:#0A0B0D;font-weight:600;font-size:14px;border-radius:10px;padding:13px;text-decoration:none;transition:opacity .15s}
    .btn-github:hover{opacity:.9} .btn-github .rec{font-family:var(--mono);font-size:10px;background:rgba(10,11,13,.15);padding:3px 7px;border-radius:20px}
    .divider{display:flex;align-items:center;gap:12px;margin:18px 0;color:var(--dim);font-family:var(--mono);font-size:12px}
    .divider::before,.divider::after{content:"";flex:1;height:1px;background:var(--line)}
    .modal-form{display:flex;flex-direction:column;gap:15px}
    .field{display:flex;flex-direction:column;gap:7px} .field label{font-family:var(--mono);font-size:12px;color:var(--mut)}
    .field input{background:#0b0e12;border:1px solid var(--line2);border-radius:9px;padding:12px;color:var(--txt);font-family:var(--disp);font-size:14px;transition:border-color .15s}
    .field input:focus{outline:none;border-color:var(--lime)} .field input.err{border-color:var(--mag)}
    .err-msg{color:var(--mag);font-size:12px} .pw{position:relative;display:flex} .pw input{flex:1;padding-right:56px}
    .pw-t{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--dim);font-family:var(--mono);font-size:12px;cursor:pointer}
    .pw-str{display:flex;align-items:center;gap:6px;margin-top:2px} .pw-str i{height:3px;flex:1;background:var(--line2);border-radius:2px}
    .pw-str i.a{background:var(--mag)} .pw-str i.b{background:#f0b849} .pw-str i.c{background:var(--lime)}
    .pw-str span{font-family:var(--mono);font-size:11px;color:var(--dim)}
    .form-err{background:rgba(255,61,119,.1);border:1px solid rgba(255,61,119,.3);color:#ff8fb0;font-size:13px;border-radius:8px;padding:10px}
    .modal-switch{text-align:center;color:var(--mut);font-size:13px;margin-top:18px}
    .modal-switch button{background:none;border:none;color:var(--lime);cursor:pointer;font-weight:600;font-size:13px}
    .spin{width:14px;height:14px;border:2px solid rgba(10,11,13,.3);border-top-color:#0A0B0D;border-radius:50%;animation:sp .6s linear infinite}
    @keyframes sp{to{transform:rotate(360deg)}}

    @media(max-width:940px){
      .hero{grid-template-columns:1fr;padding:56px 24px 70px}
      .how,.companies .co-grid{grid-template-columns:1fr;gap:36px}
      .grid-4,.grid-3,.stats{grid-template-columns:1fr 1fr}
      .nav-links{display:none} .nav{padding:16px 22px} .sec{padding:72px 24px}
      .chip{display:none}
    }
    @media(max-width:560px){ .grid-4,.grid-3,.stats{grid-template-columns:1fr} .actions{flex-direction:column} .actions .btn{width:100%;justify-content:center} }
  `],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private host = inject(ElementRef<HTMLElement>);
  loginUrl = `${environment.apiUrl}/auth/github`;
  theme    = signal<'dark' | 'light'>('dark');
  modal    = signal<ModalMode>(null);

  // The versus mark, injected wherever the logo appears.
  markSvg: SafeHtml;

  // Form state
  formEmail    = '';
  formPassword = '';
  formLoading  = signal(false);
  formError    = signal<string | null>(null);
  showPassword = signal(false);
  fieldErrors  = signal<Record<string, string>>({});
  pwStrength   = signal(0);
  pwLabel      = signal('');

  animOn = signal(false); // set true once GSAP is driving, gates the scroll-reveal hiding
  private gsapCtx?: gsap.Context;
  private onMouseMove?: (e: MouseEvent) => void;

  constructor(public authService: AuthService, private router: Router, sanitizer: DomSanitizer) {
    this.markSvg = sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="MatchMood">
        <path d="M8 9 L14 16 L8 23" fill="none" stroke="#C6FF3D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 9 L18 16 L24 23" fill="none" stroke="#FF3D77" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="15.1" y="9.5" width="1.8" height="13" rx="0.9" fill="#EDEDED"/>
      </svg>`
    );
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const root = this.host.nativeElement as HTMLElement;
    // Respect users who asked for less motion.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.animOn.set(true);

    this.gsapCtx = gsap.context(() => {
      // Hero intro timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.eyebrow', { y: 14, opacity: 0, duration: .6 })
        .from('.title .ln', { yPercent: 110, duration: .9, stagger: .09 }, '-=.3')
        .from('.lede', { y: 18, opacity: 0, duration: .7 }, '-=.5')
        .from('.actions .btn', { y: 16, opacity: 0, duration: .5, stagger: .08 }, '-=.4')
        .from('.trust', { opacity: 0, duration: .6 }, '-=.3')
        .from('.stage', { y: 40, opacity: 0, duration: 1 }, '-=.9')
        .from('.chip', { scale: .6, opacity: 0, duration: .5, stagger: .12 }, '-=.4')
        .add(() => this.scramble(root.querySelector('.scramble')), '-=.6');

      // fill the duel bars
      gsap.from('.f-bar .fill', { scaleX: 0, transformOrigin: 'left', duration: 1.1, ease: 'power2.out', delay: .8 });

      // scroll reveals
      root.querySelectorAll('[data-reveal]').forEach((el) => {
        ScrollTrigger.create({
          trigger: el, start: 'top 86%',
          onEnter: () => el.classList.add('in'),
        });
      });

      // stat counters
      root.querySelectorAll<HTMLElement>('.s-val').forEach((el) => {
        const end = +(el.dataset['count'] ?? '0');
        const suffix = el.dataset['suffix'] ?? '';
        ScrollTrigger.create({
          trigger: el, start: 'top 88%', once: true,
          onEnter: () => {
            const obj = { v: 0 };
            gsap.to(obj, { v: end, duration: 1.6, ease: 'power2.out',
              onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString() + suffix; } });
          },
        });
      });

      // subtle parallax on the stage
      gsap.to('.stage', { yPercent: -6, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

      // magnetic buttons
      root.querySelectorAll<HTMLElement>('.magnetic').forEach((btn) => {
        const move = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .3 });
        };
        const leave = () => gsap.to(btn, { x: 0, y: 0, duration: .4, ease: 'elastic.out(1,.4)' });
        btn.addEventListener('mousemove', move);
        btn.addEventListener('mouseleave', leave);
      });
    }, root);

    // cursor glow follow
    const glow = root.querySelector<HTMLElement>('.cursor-glow');
    if (glow) {
      const qx = gsap.quickTo(glow, 'x', { duration: .5, ease: 'power3' });
      const qy = gsap.quickTo(glow, 'y', { duration: .5, ease: 'power3' });
      this.onMouseMove = (e: MouseEvent) => { qx(e.clientX); qy(e.clientY); };
      window.addEventListener('mousemove', this.onMouseMove);
    }
  }

  ngOnDestroy(): void {
    if (this.onMouseMove) window.removeEventListener('mousemove', this.onMouseMove);
    this.gsapCtx?.revert(); // kills every tween + ScrollTrigger created above
  }

  // Terminal-style scramble reveal for the headline word.
  private scramble(el: Element | null): void {
    if (!el) return;
    const final = 'résumé.';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/{}[]=_$#';
    let frame = 0;
    const total = 26;
    const tick = () => {
      const p = frame / total;
      const out = final.split('').map((c, i) => {
        if (c === ' ') return ' ';
        return i < p * final.length ? c : chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      el.textContent = out;
      if (frame++ <= total) requestAnimationFrame(tick);
      else el.textContent = final;
    };
    tick();
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  scrollTop(): void { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  handleCta(mode: ModalMode): void {
    if (this.authService.isLoggedIn()) this.router.navigate(['/dashboard']);
    else this.modal.set(mode);
  }

  openModal(mode: ModalMode): void { this.modal.set(mode); }
  closeModal(): void { this.modal.set(null); this.resetForm(); }
  switchTo(mode: ModalMode): void { this.resetForm(); this.modal.set(mode); }
  fieldError(field: string): string | null { return this.fieldErrors()[field] ?? null; }

  onPasswordInput(): void {
    const p = this.formPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) || /[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p) && p.length >= 10) score++;
    this.pwStrength.set(score);
    this.pwLabel.set(['', 'weak', 'fair', 'strong'][score]);
  }

  submitForm(e: Event): void {
    e.preventDefault();
    this.formError.set(null);
    this.fieldErrors.set({});
    if (this.modal() === 'signup') this.doRegister();
    else this.doLogin();
  }

  private doRegister(): void {
    const errors: Record<string, string> = {};
    if (!this.formEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formEmail)) errors['email'] = 'Enter a valid email';
    if (!this.formPassword || this.formPassword.length < 8) errors['password'] = 'Minimum 8 characters';
    if (Object.keys(errors).length) { this.fieldErrors.set(errors); return; }

    this.formLoading.set(true);
    this.authService.register(this.formEmail, this.formPassword).subscribe({
      next:  () => { this.formLoading.set(false); },
      error: (err) => {
        this.formLoading.set(false);
        const msg: string = err?.error?.error ?? 'Something went wrong. Try again.';
        if (msg.toLowerCase().includes('email')) this.fieldErrors.update(f => ({ ...f, email: msg }));
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
        this.formError.set(err?.error?.error ?? 'Something went wrong. Try again.');
      },
    });
  }

  private resetForm(): void {
    this.formEmail = ''; this.formPassword = '';
    this.formError.set(null); this.fieldErrors.set({});
    this.formLoading.set(false); this.showPassword.set(false);
    this.pwStrength.set(0); this.pwLabel.set('');
  }
}
