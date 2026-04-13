import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FaqModalService } from '../../core/services/faq-modal.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page page-enter">

      <!-- Hero -->
      <div class="hero">
        <div class="hero-tag">Pricing</div>
        <h1>Level up your coding career</h1>
        <p class="hero-sub">Compete, prove your skills, and get discovered by top companies.</p>
      </div>

      <!-- Billing toggle -->
      <div class="billing-wrap">
        <button class="billing-opt" [class.active]="billing() === 'monthly'" (click)="billing.set('monthly')">Monthly</button>
        <button class="billing-opt" [class.active]="billing() === 'annual'" (click)="billing.set('annual')">
          Annual
          <span class="save-badge">Save 20%</span>
        </button>
      </div>

      <!-- Plans -->
      <div class="plans">

        <!-- Free -->
        <div class="plan" [class.dimmed]="currentTier() !== 'FREE'">
          @if (currentTier() === 'FREE') {
            <div class="current-checkmark">✓ Current</div>
          }
          <div class="plan-top">
            <div class="plan-name">Free</div>
            <div class="plan-price">$0<span class="plan-period"> /mo</span></div>
            <div class="plan-tagline">Start competing today</div>
          </div>
          <ul class="features">
            <li><span class="check">✓</span> Unlimited matches</li>
            <li><span class="check">✓</span> Easy & Medium challenges</li>
            <li><span class="check">✓</span> Basic profile</li>
            <li><span class="check">✓</span> Last 10 matches history</li>
            <li><span class="check">✓</span> Global ranking (view only)</li>
          </ul>
          <div class="plan-action">
            @if (currentTier() === 'FREE') {
              <div class="badge-current">Current plan</div>
            } @else {
              <div class="badge-included">Included</div>
            }
          </div>
        </div>

        <!-- Premium — featured -->
        <div class="plan plan-featured">
          <div class="popular-badge">Most Popular</div>
          @if (currentTier() === 'PREMIUM') {
            <div class="current-checkmark">✓ Current</div>
          }
          <div class="plan-top">
            <div class="plan-name premium-name">Premium</div>
            <div class="plan-price">
              {{ billing() === 'annual' ? '$7' : '$9' }}<span class="plan-period"> /mo</span>
            </div>
            @if (billing() === 'annual') {
              <div class="annual-note">Billed $84/yr · save $24</div>
            }
            <div class="plan-tagline">For serious competitors</div>
          </div>
          <ul class="features">
            <li><span class="check">✓</span> Everything in Free</li>
            <li><span class="check">✓</span> Hard challenges</li>
            <li><span class="check check-green">✓</span> <strong>Verified badge on profile</strong></li>
            <li><span class="check check-green">✓</span> <strong>Full match history</strong></li>
            <li><span class="check check-green">✓</span> <strong>Detailed stats</strong></li>
            <li><span class="check check-green">✓</span> <strong>Top 100 ranking highlighted</strong></li>
            <li><span class="check check-green">✓</span> <strong>Verifiable certificate</strong></li>
          </ul>
          <div class="plan-action">
            @if (currentTier() === 'PREMIUM') {
              <div class="badge-current badge-premium">Current plan</div>
            } @else if (currentTier() === 'ENTERPRISE') {
              <div class="badge-included">Included in Enterprise</div>
            } @else {
              <button class="btn-upgrade btn-premium" [disabled]="!!loading()" (click)="upgrade('PREMIUM')">
                {{ loading() === 'PREMIUM' ? 'Redirecting...' : 'Upgrade to Premium' }}
              </button>
            }
          </div>
        </div>

        <!-- Enterprise -->
        <div class="plan plan-enterprise">
          @if (currentTier() === 'ENTERPRISE') {
            <div class="current-checkmark">✓ Current</div>
          }
          <div class="plan-top">
            <div class="plan-name enterprise-name">Enterprise</div>
            <div class="plan-price">
              {{ billing() === 'annual' ? '$79' : '$99' }}<span class="plan-period"> /mo</span>
            </div>
            @if (billing() === 'annual') {
              <div class="annual-note">Billed $948/yr · save $240</div>
            }
            <div class="plan-tagline">For teams & recruiters</div>
          </div>
          <ul class="features">
            <li><span class="check">✓</span> Everything in Premium</li>
            <li><span class="check check-purple">✓</span> <strong>Full ranking with filters</strong></li>
            <li><span class="check check-purple">✓</span> <strong>View any dev's full history</strong></li>
            <li><span class="check check-purple">✓</span> <strong>Contact devs directly</strong></li>
            <li><span class="check check-purple">✓</span> <strong>Custom recruiting challenges</strong></li>
            <li><span class="check check-purple">✓</span> <strong>Private rooms</strong></li>
            <li><span class="check">✓</span> Company logo on platform</li>
          </ul>
          <div class="plan-action">
            @if (currentTier() === 'ENTERPRISE') {
              <div class="badge-current badge-enterprise">Current plan</div>
            } @else {
              <button class="btn-upgrade btn-enterprise" [disabled]="!!loading()" (click)="upgrade('ENTERPRISE')">
                {{ loading() === 'ENTERPRISE' ? 'Redirecting...' : 'Get Enterprise' }}
              </button>
            }
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="footer-row">
        <span class="footer-note">Cancel anytime · Secure payments via Stripe</span>
        <button class="faq-btn" (click)="faqModal.open()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14">
            <circle cx="8" cy="8" r="6.5"/>
            <path d="M6.2 6.1a1.85 1.85 0 0 1 3.55.7c0 1.3-1.85 1.6-1.85 3"/>
            <circle cx="8" cy="12" r=".6" fill="currentColor" stroke="none"/>
          </svg>
          FAQ
        </button>
      </div>

    </div>
  `,
  styles: [`
    .page { flex: 1; overflow-y: auto; padding: 60px 32px; display: flex; flex-direction: column; justify-content: center; align-items: center; }

    /* Hero */
    .hero { text-align: center; margin-bottom: 40px; }
    .hero-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--green); margin-bottom: 16px; }
    h1 { font-size: 40px; font-weight: 900; letter-spacing: -1.5px; margin: 0 0 14px; color: var(--text-primary); }
    .hero-sub { font-size: 16px; color: var(--text-muted); margin: 0; }

    /* Billing toggle */
    .billing-wrap {
      display: flex; align-items: center; gap: 4px;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 4px; margin-bottom: 28px;
    }
    .billing-opt {
      background: none; border: none; padding: 8px 20px;
      font-size: 13px; font-weight: 600; color: var(--text-muted);
      border-radius: 7px; cursor: pointer; transition: background 150ms, color 150ms;
      display: flex; align-items: center; gap: 8px;
    }
    .billing-opt.active { background: rgba(255,255,255,0.08); color: var(--text-primary); }
    .save-badge {
      font-size: 10px; font-weight: 800; letter-spacing: 0.05em;
      background: rgba(34,197,94,0.15); color: var(--green);
      padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(34,197,94,0.25);
    }

    /* Plans */
    .plans { display: flex; gap: 18px; justify-content: center; max-width: 1020px; align-items: stretch; flex-wrap: wrap; margin-bottom: 28px; }

    /* Plan card */
    .plan {
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 28px; width: 300px;
      display: flex; flex-direction: column; position: relative;
      transition: border-color 150ms ease, transform 150ms ease;
    }
    .plan:hover { border-color: var(--border-bright); transform: translateY(-2px); }
    .plan.dimmed { opacity: 0.5; }
    .plan.dimmed:hover { transform: none; }

    .plan-featured {
      border-color: rgba(34,197,94,0.3);
      background: linear-gradient(160deg, #030d03 0%, var(--bg-surface) 60%);
    }
    .plan-featured:hover { border-color: rgba(34,197,94,0.5); }

    .plan-enterprise {
      border-color: rgba(139,92,246,0.2);
      background: linear-gradient(160deg, #08040f 0%, var(--bg-surface) 60%);
    }
    .plan-enterprise:hover { border-color: rgba(139,92,246,0.4); }

    .current-checkmark {
      position: absolute; top: 14px; right: 14px;
      font-size: 10px; font-weight: 700; color: var(--green);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .popular-badge {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      background: var(--green); color: #000; padding: 4px 16px;
      border-radius: 20px; font-size: 11px; font-weight: 800;
      white-space: nowrap; letter-spacing: 0.05em;
    }

    .plan-top { margin-bottom: 24px; margin-top: 8px; }
    .plan-name { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 10px; }
    .premium-name    { color: var(--green); }
    .enterprise-name { color: #a78bfa; }
    .plan-price  { font-size: 48px; font-weight: 900; letter-spacing: -2px; line-height: 1; margin-bottom: 4px; color: var(--text-primary); }
    .plan-period { font-size: 16px; font-weight: 400; color: var(--text-muted); letter-spacing: 0; }
    .annual-note { font-size: 11px; color: var(--green); margin-bottom: 6px; font-weight: 600; }
    .plan-tagline { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

    .features { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .features li { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--text-muted); line-height: 1.4; }
    .features li strong { color: var(--text-secondary); font-weight: 600; }
    .check        { color: var(--border-bright); font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .check-green  { color: var(--green); }
    .check-purple { color: #a78bfa; }

    .plan-action { margin-top: auto; }
    .btn-upgrade {
      width: 100%; padding: 13px; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      transition: opacity 150ms ease, transform 100ms ease;
    }
    .btn-upgrade:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
    .btn-upgrade:active:not(:disabled) { transform: scale(0.98); }
    .btn-upgrade:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-premium    { background: var(--green); color: #000; }
    .btn-enterprise { background: #7c3aed; color: #fff; }

    .badge-current { text-align: center; padding: 11px; border-radius: 8px; font-size: 13px; font-weight: 600; background: var(--bg-elevated); color: var(--text-muted); border: 1px solid var(--border); }
    .badge-current.badge-premium    { background: var(--green-glow); color: var(--green); border-color: rgba(34,197,94,0.25); }
    .badge-current.badge-enterprise { background: rgba(139,92,246,0.1); color: #a78bfa; border-color: rgba(139,92,246,0.25); }
    .badge-included { text-align: center; padding: 11px; border-radius: 8px; font-size: 13px; color: var(--text-muted); background: var(--bg-elevated); border: 1px solid var(--border); }

    /* Footer row */
    .footer-row {
      display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap;
    }
    .footer-note { font-size: 12px; color: var(--text-muted); }
    .faq-btn {
      display: flex; align-items: center; gap: 6px;
      background: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
      padding: 6px 14px; font-size: 12px; font-weight: 600;
      color: rgba(255,255,255,0.4); cursor: pointer;
      transition: color 150ms, border-color 150ms, background 150ms;
    }
    .faq-btn:hover { color: #fff; border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.04); }

    @media (max-width: 768px) {
      .plans { flex-direction: column; align-items: center; }
      .plan  { width: 100%; max-width: 400px; }
    }
  `],
})
export class SubscriptionComponent {
  currentTier = signal(this.authService.user()?.tier ?? 'FREE');
  loading     = signal<'PREMIUM' | 'ENTERPRISE' | null>(null);
  billing     = signal<'monthly' | 'annual'>('monthly');

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    public faqModal: FaqModalService,
  ) {}

  upgrade(tier: 'PREMIUM' | 'ENTERPRISE'): void {
    this.loading.set(tier);
    this.http.post<{ url: string }>(`${environment.apiUrl}/stripe/create-checkout`, { tier, billing: this.billing() })
      .subscribe({
        next: ({ url }) => window.location.href = url,
        error: () => this.loading.set(null),
      });
  }
}
