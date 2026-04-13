import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameSetupModalService, SetupDifficulty, SetupLanguage } from '../../core/services/game-setup-modal.service';
import { AuthService } from '../../core/services/auth.service';

const LANGUAGES: { id: SetupLanguage; label: string; color: string }[] = [
  { id: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { id: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { id: 'python',     label: 'Python',     color: '#3776ab' },
  { id: 'go',         label: 'Go',         color: '#00add8' },
  { id: 'rust',       label: 'Rust',       color: '#f74c00' },
  { id: 'java',       label: 'Java',       color: '#f89820' },
  { id: 'cpp',        label: 'C++',        color: '#9c33b5' },
];

@Component({
  selector: 'app-game-setup-modal',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (svc.isOpen()) {
      <div class="gsm-bd" (click)="svc.close()">
        <div class="gsm-modal" (click)="$event.stopPropagation()">

          <div class="gsm-header">
            <div class="gsm-header-left">
              <span class="gsm-title">Match Setup</span>
              <span class="gsm-sub">Choose your language and difficulty</span>
            </div>
            <button class="gsm-close" (click)="svc.close()">✕</button>
          </div>

          <!-- Language -->
          <div class="gsm-section">
            <span class="gsm-label">Language</span>
            <div class="gsm-grid">
              @for (lang of languages; track lang.id) {
                <button class="gsm-chip"
                  [class.selected]="svc.language() === lang.id"
                  [style.--lc]="lang.color"
                  (click)="svc.language.set(lang.id)">
                  {{ lang.label }}
                </button>
              }
            </div>
          </div>

          <!-- Difficulty -->
          <div class="gsm-section">
            <span class="gsm-label">Difficulty</span>
            <div class="gsm-diff-row">
              <button class="gsm-diff sel-easy"
                [class.active]="svc.difficulty() === 'easy'"
                (click)="svc.difficulty.set('easy')">Easy</button>
              <button class="gsm-diff sel-medium"
                [class.active]="svc.difficulty() === 'medium'"
                (click)="svc.difficulty.set('medium')">Medium</button>
              <button class="gsm-diff sel-hard"
                [class.active]="svc.difficulty() === 'hard'"
                [disabled]="isFree()"
                (click)="!isFree() && svc.difficulty.set('hard')">
                Hard
                @if (isFree()) { <span class="diff-lock">🔒</span> }
              </button>
            </div>
            @if (isFree()) {
              <span class="gsm-note">Hard challenges require <a routerLink="/subscription" (click)="svc.close()">Premium</a></span>
            }
          </div>

          <button class="gsm-confirm" (click)="svc.confirm()">Find Match →</button>

        </div>
      </div>
    }
  `,
  styles: [`
    .gsm-bd {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .gsm-modal {
      background: rgba(10,10,10,0.98); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px; max-width: 480px; width: 100%;
      display: flex; flex-direction: column;
      box-shadow: 0 0 80px rgba(0,0,0,0.8);
      animation: gsmIn 200ms ease both;
    }
    @keyframes gsmIn { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:none} }

    .gsm-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 22px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .gsm-header-left { display: flex; flex-direction: column; gap: 3px; }
    .gsm-title { font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.4px; }
    .gsm-sub   { font-size: 12px; color: rgba(255,255,255,0.35); }
    .gsm-close {
      background: none; border: none; color: rgba(255,255,255,0.35);
      font-size: 14px; cursor: pointer; padding: 4px 6px; border-radius: 6px;
      transition: color 150ms, background 150ms; line-height: 1;
    }
    .gsm-close:hover { color: #fff; background: rgba(255,255,255,0.07); }

    .gsm-section {
      padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex; flex-direction: column; gap: 12px;
    }
    .gsm-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: rgba(255,255,255,0.35);
    }

    .gsm-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .gsm-chip {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 9px 4px; font-size: 12px; font-weight: 600;
      color: rgba(255,255,255,0.4); cursor: pointer; transition: all 150ms; text-align: center;
    }
    .gsm-chip:hover {
      background: color-mix(in srgb, var(--lc) 10%, transparent);
      border-color: color-mix(in srgb, var(--lc) 35%, transparent);
      color: var(--lc);
    }
    .gsm-chip.selected {
      background: color-mix(in srgb, var(--lc) 15%, transparent);
      border-color: color-mix(in srgb, var(--lc) 55%, transparent);
      color: var(--lc);
    }

    .gsm-diff-row { display: flex; gap: 8px; }
    .gsm-diff {
      flex: 1; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 150ms;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .gsm-diff:disabled { opacity: 0.35; cursor: not-allowed; }

    /* Easy — verde */
    .gsm-diff.sel-easy   { background: rgba(34,197,94,0.06);  border: 1px solid rgba(34,197,94,0.2);  color: rgba(34,197,94,0.5);  }
    .gsm-diff.sel-easy.active,
    .gsm-diff.sel-easy:hover:not(:disabled)  { background: rgba(34,197,94,0.14); border-color: rgba(34,197,94,0.5);  color: #22c55e; }
    /* Medium — amarillo */
    .gsm-diff.sel-medium { background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.2); color: rgba(251,191,36,0.5); }
    .gsm-diff.sel-medium.active,
    .gsm-diff.sel-medium:hover:not(:disabled) { background: rgba(251,191,36,0.14); border-color: rgba(251,191,36,0.5); color: #fbbf24; }
    /* Hard — rojo */
    .gsm-diff.sel-hard   { background: rgba(244,63,94,0.06);  border: 1px solid rgba(244,63,94,0.2);  color: rgba(244,63,94,0.5);  }
    .gsm-diff.sel-hard.active,
    .gsm-diff.sel-hard:hover:not(:disabled)  { background: rgba(244,63,94,0.14); border-color: rgba(244,63,94,0.5);  color: #f43f5e; }
    .diff-lock { font-size: 11px; }
    .gsm-note { font-size: 11px; color: rgba(255,255,255,0.3); }
    .gsm-note a { color: #22c55e; text-decoration: none; }
    .gsm-note a:hover { text-decoration: underline; }

    .gsm-confirm {
      margin: 20px 24px; border: none; border-radius: 10px; padding: 14px;
      font-size: 15px; font-weight: 700; color: #000; cursor: pointer;
      background: #22c55e;
      transition: filter 150ms, transform 100ms;
    }
    .gsm-confirm:hover  { filter: brightness(.9); }
    .gsm-confirm:active { transform: scale(0.98); }
  `],
})
export class GameSetupModalComponent {
  readonly svc  = inject(GameSetupModalService);
  readonly auth = inject(AuthService);
  readonly languages = LANGUAGES;

  isFree(): boolean {
    return this.auth.user()?.tier === 'FREE';
  }
}
