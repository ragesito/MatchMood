import { Component, signal, inject } from '@angular/core';
import { FaqModalService } from '../../core/services/faq-modal.service';

const FAQS = [
  { q: 'Can I cancel at any time?',                 a: 'Yes. You can cancel your subscription anytime from your profile settings. You will keep access until the end of your current billing period.' },
  { q: 'What happens to my data if I downgrade?',   a: 'Your match history and stats are always preserved. You simply lose access to the higher-tier features — nothing is deleted.' },
  { q: 'Is there a free trial?',                    a: 'The Free plan is permanent with no time limit. Premium and Enterprise come with a 7-day money-back guarantee if you are not satisfied.' },
  { q: 'What payment methods do you accept?',       a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex) as well as several digital wallets, all processed securely through Stripe.' },
  { q: 'Does Enterprise work for an entire team?',  a: 'Enterprise is designed for recruiting teams and companies. Contact us if you need multiple seats or custom corporate billing.' },
];

@Component({
  selector: 'app-faq-modal',
  standalone: true,
  template: `
    @if (svc.isOpen()) {
      <div class="faq-bd" (click)="svc.close()">
        <div class="faq-modal" (click)="$event.stopPropagation()">

          <div class="fm-header">
            <div class="fm-header-left">
              <span class="fm-title">FAQ</span>
              <span class="fm-sub">Common questions answered</span>
            </div>
            <button class="fm-close" (click)="svc.close()">✕</button>
          </div>

          <div class="fm-body">
            @for (faq of faqs; track faq.q; let i = $index) {
              <div class="fm-item" [class.fm-open]="open() === i">
                <button class="fm-q" (click)="toggle(i)">
                  <span>{{ faq.q }}</span>
                  <span class="fm-icon">{{ open() === i ? '×' : '+' }}</span>
                </button>
                @if (open() === i) {
                  <div class="fm-a">{{ faq.a }}</div>
                }
              </div>
            }
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .faq-bd {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .faq-modal {
      background: rgba(10,10,10,0.98); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px; max-width: 560px; width: 100%; max-height: 85vh;
      display: flex; flex-direction: column;
      box-shadow: 0 0 80px rgba(0,0,0,0.8);
      animation: faqModalIn 220ms ease both;
    }
    @keyframes faqModalIn { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:none} }

    .fm-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 22px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
    }
    .fm-header-left { display: flex; flex-direction: column; gap: 3px; }
    .fm-title { font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.4px; }
    .fm-sub   { font-size: 12px; color: rgba(255,255,255,0.35); }
    .fm-close {
      background: none; border: none; color: rgba(255,255,255,0.35);
      font-size: 14px; cursor: pointer; padding: 4px 6px; border-radius: 6px;
      transition: color 150ms, background 150ms; line-height: 1;
    }
    .fm-close:hover { color: #fff; background: rgba(255,255,255,0.07); }

    .fm-body { display: flex; flex-direction: column; gap: 6px; padding: 16px; overflow-y: auto; flex: 1; min-height: 0; }

    .fm-item { border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; overflow: hidden; transition: border-color 150ms; }
    .fm-item.fm-open { border-color: rgba(255,255,255,0.14); }
    .fm-q {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px;
      background: none; border: none; cursor: pointer;
      padding: 15px 16px; font-size: 13px; font-weight: 600; color: #fff;
      text-align: left; transition: background 150ms;
    }
    .fm-q:hover { background: rgba(255,255,255,0.03); }
    .fm-icon { font-size: 18px; font-weight: 400; color: rgba(255,255,255,0.4); flex-shrink: 0; line-height: 1; }
    .fm-a {
      padding: 0 16px 14px; font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.65;
      animation: faqAIn 160ms ease both;
    }
    @keyframes faqAIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
  `],
})
export class FaqModalComponent {
  readonly svc  = inject(FaqModalService);
  readonly faqs = FAQS;
  readonly open = signal<number | null>(null);

  toggle(i: number): void {
    this.open.set(this.open() === i ? null : i);
  }
}
