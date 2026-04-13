import { Component, inject } from '@angular/core';
import { RankModalService } from '../../core/services/rank-modal.service';
import { RANKS, getRank, getNextRank, getRankProgress } from '../../core/constants/ranks';

@Component({
  selector: 'app-rank-modal',
  standalone: true,
  template: `
    @if (svc.isOpen()) {
      <div class="rank-bd" (click)="svc.close()">
        <div class="rank-modal" (click)="$event.stopPropagation()">

          <div class="rm-header">
            <div class="rm-header-left">
              <span class="rm-title">Rank System</span>
              <span class="rm-sub">ELO-based competitive tiers</span>
            </div>
            <button class="rm-close" (click)="svc.close()">✕</button>
          </div>

          <div class="rm-list">
            @for (rank of allRanks; track rank.label) {
              <div class="rm-row"
                [class.rm-current]="curRank().label === rank.label"
                [style.--rc]="rank.color">
                <div class="rm-icon-wrap"
                  [style.background]="rank.bgColor"
                  [style.border-color]="rank.color + '44'">
                  <span class="rm-icon">{{ rank.icon }}</span>
                </div>
                <div class="rm-info">
                  <span class="rm-label" [style.color]="rank.color">{{ rank.label }}</span>
                  <span class="rm-desc">{{ rank.description }}</span>
                </div>
                <div class="rm-range-col">
                  <span class="rm-range">{{ rank.min }}{{ rank.max !== null ? '–' + rank.max : '+' }}</span>
                  <span class="rm-range-lbl">ELO</span>
                </div>
                @if (curRank().label === rank.label) {
                  <span class="rm-you"
                    [style.color]="rank.color"
                    [style.border-color]="rank.color + '55'"
                    [style.background]="rank.bgColor">YOU</span>
                }
              </div>
            }
          </div>

          <div class="rm-footer">
            <div class="rm-progress-wrap">
              <div class="rm-progress-row">
                <span class="rm-progress-label">
                  Progress to <strong>{{ nxtRank()?.label ?? 'Grandmaster' }}</strong>
                </span>
                <span class="rm-progress-pct">{{ progress() }}%</span>
              </div>
              <div class="rm-track">
                <div class="rm-fill"
                  [style.width.%]="progress()"
                  [style.background]="curRank().color">
                </div>
              </div>
              <div class="rm-elo-row">
                <span class="rm-elo-cur" [style.color]="curRank().color">{{ svc.rating() }} ELO</span>
                @if (nxtRank(); as next) {
                  <span class="rm-elo-next">{{ next.min }} ELO</span>
                }
              </div>
            </div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .rank-bd {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .rank-modal {
      background: rgba(10,10,10,0.98); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px; max-width: 520px; width: 100%; max-height: 85vh;
      display: flex; flex-direction: column;
      box-shadow: 0 0 80px rgba(0,0,0,0.8);
      animation: rankModalIn 220ms ease both;
    }
    @keyframes rankModalIn { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:none} }

    .rm-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 22px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
    }
    .rm-header-left { display: flex; flex-direction: column; gap: 3px; }
    .rm-title { font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.4px; }
    .rm-sub   { font-size: 12px; color: rgba(255,255,255,0.35); }
    .rm-close {
      background: none; border: none; color: rgba(255,255,255,0.35);
      font-size: 14px; cursor: pointer; padding: 4px 6px; border-radius: 6px;
      transition: color 150ms, background 150ms; line-height: 1;
    }
    .rm-close:hover { color: #fff; background: rgba(255,255,255,0.07); }

    .rm-list {
      display: flex; flex-direction: column; overflow-y: auto;
      gap: 2px; padding: 12px 16px; flex: 1; min-height: 0;
    }
    .rm-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px; border: 1px solid transparent;
      transition: background 150ms;
    }
    .rm-row:hover { background: rgba(255,255,255,0.04); }
    .rm-current {
      background: color-mix(in srgb, var(--rc) 8%, transparent) !important;
      border-color: color-mix(in srgb, var(--rc) 25%, transparent) !important;
    }
    .rm-icon-wrap {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; border: 1px solid transparent;
    }
    .rm-icon { font-size: 20px; line-height: 1; }
    .rm-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .rm-label { font-size: 14px; font-weight: 800; letter-spacing: -0.2px; }
    .rm-desc  { font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.4; }
    .rm-range-col { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex-shrink: 0; }
    .rm-range     { font-size: 13px; font-weight: 800; color: rgba(255,255,255,0.7); letter-spacing: -0.3px; }
    .rm-range-lbl { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.06em; }
    .rm-you {
      font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
      padding: 3px 8px; border-radius: 999px; border: 1px solid; flex-shrink: 0;
    }

    .rm-footer { padding: 16px 24px 20px; border-top: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
    .rm-progress-wrap { display: flex; flex-direction: column; gap: 8px; }
    .rm-progress-row  { display: flex; justify-content: space-between; align-items: center; }
    .rm-progress-label { font-size: 12px; color: rgba(255,255,255,0.45); }
    .rm-progress-label strong { color: rgba(255,255,255,0.75); font-weight: 700; }
    .rm-progress-pct  { font-size: 13px; font-weight: 800; color: rgba(255,255,255,0.65); }
    .rm-track { height: 6px; background: rgba(255,255,255,0.07); border-radius: 999px; overflow: hidden; }
    .rm-fill  { height: 100%; border-radius: 999px; transition: width 800ms cubic-bezier(.4,0,.2,1); }
    .rm-elo-row { display: flex; justify-content: space-between; align-items: center; }
    .rm-elo-cur  { font-size: 12px; font-weight: 800; }
    .rm-elo-next { font-size: 11px; color: rgba(255,255,255,0.35); }
  `]
})
export class RankModalComponent {
  readonly svc      = inject(RankModalService);
  readonly allRanks = RANKS;

  curRank()  { return getRank(this.svc.rating()); }
  nxtRank()  { return getNextRank(this.svc.rating()); }
  progress() { return getRankProgress(this.svc.rating()); }
}
