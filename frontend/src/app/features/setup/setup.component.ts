import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { Subject } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { NgxSteelBeamsComponent } from '@omnedia/ngx-steel-beams';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', icon: 'JS' },
  { id: 'typescript', label: 'TypeScript', icon: 'TS' },
  { id: 'python',     label: 'Python',     icon: 'PY' },
  { id: 'go',         label: 'Go',         icon: 'GO' },
  { id: 'rust',       label: 'Rust',       icon: 'RS' },
  { id: 'java',       label: 'Java',       icon: 'JV' },
  { id: 'cpp',        label: 'C++',        icon: 'C+' },
  { id: 'other',      label: 'Other',      icon: '??' },
];

const SKILL_LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: "I'm learning, challenges are fun" },
  { id: 'intermediate', label: 'Intermediate', desc: 'I solve LeetCode problems regularly' },
  { id: 'advanced',     label: 'Advanced',     desc: 'I eat binary trees for breakfast' },
];

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSteelBeamsComponent],
  template: `
    <om-steel-beams class="setup-bg"></om-steel-beams>
    <div class="setup-blur"></div>
    <div class="setup-page">
      <div class="setup-card">

        <!-- Logo -->
        <div class="setup-logo">
          <span class="logo-mark">⚡</span>
          <span class="logo-text">MatchMood</span>
        </div>

        <!-- Progress bars -->
        <div class="progress-bars">
          @for (i of [1, 2, 3]; track i) {
            <div class="prog-bar" [class.active]="step() === i" [class.done]="step() > i"></div>
          }
        </div>

        <!-- Step label -->
        <div class="step-label">STEP {{ step() }} OF 3</div>

        <!-- ── Step 1: Language ── -->
        @if (step() === 1) {
          <div class="step-content">
            <h2 class="step-title">Pick your language</h2>
            <p class="step-desc">We'll tailor challenges to your stack.</p>
            <div class="lang-grid">
              @for (lang of langs; track lang.id) {
                <button
                  class="lang-btn"
                  [class.selected]="selectedLang() === lang.id"
                  (click)="selectedLang.set(lang.id)"
                >
                  <span class="lang-icon">{{ lang.icon }}</span>
                  <span class="lang-label">{{ lang.label }}</span>
                </button>
              }
            </div>
            <button class="btn-primary" [disabled]="!selectedLang()" (click)="nextStep()">
              Continue →
            </button>
          </div>
        }

        <!-- ── Step 2: Skill level ── -->
        @if (step() === 2) {
          <div class="step-content">
            <h2 class="step-title">What's your level?</h2>
            <p class="step-desc">We'll adjust difficulty over time.</p>
            <div class="skill-list">
              @for (lvl of skillLevels; track lvl.id) {
                <button
                  class="skill-btn"
                  [class.selected]="selectedSkill() === lvl.id"
                  (click)="selectedSkill.set(lvl.id)"
                >
                  <div class="skill-name">{{ lvl.label }}</div>
                  <div class="skill-desc">{{ lvl.desc }}</div>
                </button>
              }
            </div>
            <div class="btn-row">
              <button class="btn-secondary" (click)="prevStep()">← Back</button>
              <button class="btn-primary" [disabled]="!selectedSkill()" (click)="nextStep()">
                Continue →
              </button>
            </div>
          </div>
        }

        <!-- ── Step 3: Username ── -->
        @if (step() === 3) {
          <div class="step-content">
            <h2 class="step-title">Choose your username</h2>
            <p class="step-desc">Your public identity on MatchMood.</p>
            <div class="input-wrap">
              <input
                class="username-input"
                [class.has-value]="usernameInput.length > 0"
                type="text"
                placeholder="your_handle"
                [(ngModel)]="usernameInput"
                (ngModelChange)="onUsernameChange($event)"
                maxlength="20"
                autocomplete="off"
              />
              <div class="input-status">
                @if (checkingUsername()) {
                  <span class="status-checking">Checking...</span>
                } @else if (usernameInput.length >= 3 && usernameError()) {
                  <span class="status-error">✗ {{ usernameError() }}</span>
                } @else if (usernameInput.length >= 3 && !usernameError()) {
                  <span class="status-ok">✓ Available</span>
                }
              </div>
            </div>
            <div class="username-preview">
              matchmood.app/u/<strong>{{ usernameInput || 'your_handle' }}</strong>
            </div>
            <div class="btn-row">
              <button class="btn-secondary" (click)="prevStep()">← Back</button>
              <button
                class="btn-primary"
                [disabled]="!canSubmit()"
                [class.loading]="submitting()"
                (click)="submit()"
              >
                {{ submitting() ? 'Setting up...' : 'Launch MatchMood →' }}
              </button>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }

    .setup-bg {
      position: fixed;
      inset: 0;
      z-index: 0;
    }

    .setup-blur {
      position: fixed;
      inset: 0;
      z-index: 0;
      backdrop-filter: blur(8px);
      background: rgba(0, 0, 0, 0.45);
    }

    .setup-page {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .setup-card {
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 1px solid var(--border, #1f1f1f);
      border-radius: 12px;
      padding: 40px 36px;
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    /* Logo */
    .setup-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary, #fff);
    }
    .logo-mark { color: var(--green, #22c55e); font-size: 20px; }

    /* Progress bars */
    .progress-bars {
      display: flex;
      gap: 4px;
      width: 100%;
    }
    .prog-bar {
      flex: 1;
      height: 2px;
      background: var(--border, #1f1f1f);
      border-radius: 2px;
      transition: background 250ms ease;
    }
    .prog-bar.active { background: var(--green, #22c55e); }
    .prog-bar.done   { background: var(--green-dim, #16a34a); }

    /* Step label */
    .step-label {
      font-size: 11px;
      color: var(--text-muted, #52525b);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    /* Step content */
    .step-content {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      animation: stepEnter 200ms ease forwards;
    }

    @keyframes stepEnter {
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .step-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary, #fff);
      margin: 0;
      text-align: center;
      letter-spacing: -0.5px;
    }
    .step-desc {
      font-size: 14px;
      color: var(--text-muted, #52525b);
      margin: -10px 0 0;
      text-align: center;
    }

    /* Language grid */
    .lang-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      width: 100%;
    }
    .lang-btn {
      background: var(--bg-surface, #0d0d0d);
      border: 1px solid var(--border, #1f1f1f);
      border-radius: 8px;
      padding: 12px 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary, #a1a1aa);
      transition: border-color 150ms ease, background 150ms ease, color 150ms ease;
    }
    .lang-btn:hover {
      border-color: var(--border-bright, #2a2a2a);
      color: var(--text-primary, #fff);
    }
    .lang-btn.selected {
      border-color: var(--green, #22c55e);
      background: var(--green-glow, rgba(34,197,94,0.12));
      color: var(--green, #22c55e);
    }
    .lang-icon {
      font-size: 10px;
      font-weight: 700;
      font-family: monospace;
      background: var(--bg-elevated, #141414);
      padding: 3px 5px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .lang-btn.selected .lang-icon {
      background: var(--green-glow-strong, rgba(34,197,94,0.2));
    }
    .lang-label { font-size: 11px; font-weight: 500; }

    /* Skill list */
    .skill-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    .skill-btn {
      background: var(--bg-surface, #0d0d0d);
      border: 1px solid var(--border, #1f1f1f);
      border-radius: 8px;
      padding: 16px 20px;
      cursor: pointer;
      text-align: left;
      transition: border-color 150ms ease, background 150ms ease;
    }
    .skill-btn:hover {
      border-color: var(--border-bright, #2a2a2a);
    }
    .skill-btn.selected {
      border-color: var(--green, #22c55e);
      background: var(--green-glow, rgba(34,197,94,0.12));
    }
    .skill-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary, #fff);
      margin-bottom: 4px;
    }
    .skill-desc {
      font-size: 13px;
      color: var(--text-muted, #52525b);
    }
    .skill-btn.selected .skill-name { color: var(--green, #22c55e); }

    /* Username input */
    .input-wrap {
      width: 100%;
    }
    .username-input {
      width: 100%;
      background: var(--bg-surface, #0d0d0d);
      border: 1px solid var(--border, #1f1f1f);
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 15px;
      color: var(--text-primary, #fff);
      outline: none;
      transition: border-color 150ms ease, color 150ms ease;
      box-sizing: border-box;
      font-family: inherit;
    }
    .username-input::placeholder { color: var(--text-muted, #52525b); }
    .username-input:focus { border-color: var(--green, #22c55e); }
    .username-input.has-value { color: var(--green, #22c55e); }
    .input-status { height: 20px; margin-top: 6px; font-size: 12px; }
    .status-checking { color: var(--text-muted, #52525b); }
    .status-error { color: var(--red, #ef4444); }
    .status-ok    { color: var(--green, #22c55e); }

    .username-preview {
      font-size: 13px;
      color: var(--text-muted, #52525b);
      align-self: flex-start;
    }
    .username-preview strong { color: var(--text-secondary, #a1a1aa); }

    /* Buttons */
    .btn-primary {
      background: var(--green, #22c55e);
      color: #000;
      border: none;
      border-radius: 8px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      transition: background 150ms ease, transform 100ms ease;
    }
    .btn-primary:hover:not(:disabled) { background: var(--green-dim, #16a34a); }
    .btn-primary:active:not(:disabled) { transform: scale(0.98); }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary.loading { opacity: 0.7; }

    .btn-row {
      display: flex;
      gap: 10px;
      width: 100%;
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border, #1f1f1f);
      color: var(--text-secondary, #a1a1aa);
      border-radius: 8px;
      padding: 14px 20px;
      font-size: 15px;
      cursor: pointer;
      transition: border-color 150ms ease, color 150ms ease;
      white-space: nowrap;
    }
    .btn-secondary:hover {
      border-color: var(--border-bright, #2a2a2a);
      color: var(--text-primary, #fff);
    }
    .btn-row .btn-primary { flex: 1; width: auto; }
  `],
})
export class SetupComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  langs = LANGUAGES;
  skillLevels = SKILL_LEVELS;

  step = signal(1);
  selectedLang = signal('javascript');
  selectedSkill = signal('intermediate');
  usernameInput = '';

  checkingUsername = signal(false);
  usernameError = signal<string | null>(null);
  submitting = signal(false);

  private usernameSubject = new Subject<string>();

  canSubmit = computed(() =>
    !this.checkingUsername() &&
    !this.usernameError() &&
    this.usernameInput.length >= 3 &&
    !this.submitting()
  );

  constructor() {
    this.usernameSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((val) => {
        if (!val || !/^[a-zA-Z0-9_]{3,20}$/.test(val)) {
          return of(null);
        }
        this.checkingUsername.set(true);
        return this.http.get<{ available: boolean }>(
          `${environment.apiUrl}/auth/check-username?username=${encodeURIComponent(val)}`
        );
      })
    ).subscribe({
      next: (result) => {
        this.checkingUsername.set(false);
        if (result === null) {
          this.usernameError.set(this.usernameInput.length >= 3
            ? 'Only letters, numbers and underscores (3-20 chars)'
            : null);
        } else {
          this.usernameError.set(result.available ? null : 'Username already taken');
        }
      },
      error: () => {
        this.checkingUsername.set(false);
        this.usernameError.set(null);
      }
    });
  }

  onUsernameChange(val: string) {
    this.usernameError.set(null);
    if (val.length >= 3) {
      this.usernameSubject.next(val);
    }
  }

  nextStep() { this.step.update(s => s + 1); }
  prevStep() { this.step.update(s => s - 1); }

  submit() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.http.patch(`${environment.apiUrl}/auth/setup`, {
      preferredLang: this.selectedLang(),
      skillLevel: this.selectedSkill(),
      username: this.usernameInput,
    }).subscribe({
      next: () => {
        this.authService.fetchProfile().subscribe(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.status === 409) {
          this.usernameError.set('Username already taken');
        }
      }
    });
  }
}
