import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-enterprise',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="topbar">
        <a routerLink="/dashboard" class="back">← Dashboard</a>
      </div>
      <div class="content">
        <div class="badge">◆ ENTERPRISE</div>
        <h1>Enterprise Dashboard</h1>
        <p class="subtitle">Recruit the best developers on the platform</p>

        <div class="features">
          <div class="feature-card">
            <div class="icon">🏆</div>
            <h3>Global Ranking</h3>
            <p>Full ranking with filters by language, level and rating range</p>
          </div>
          <div class="feature-card">
            <div class="icon">📋</div>
            <h3>Full Profiles</h3>
            <p>View any developer's complete match history and detailed stats</p>
          </div>
          <div class="feature-card">
            <div class="icon">✉️</div>
            <h3>Contact Devs</h3>
            <p>Send direct messages to developers you want to recruit</p>
          </div>
          <div class="feature-card">
            <div class="icon">⚙️</div>
            <h3>Custom Challenges</h3>
            <p>Create your own challenges to evaluate candidates</p>
          </div>
        </div>

        <div class="coming-soon">
          Full enterprise features coming soon. Stay tuned!
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #1e1e1e; color: #fff; padding: 24px; }
    .topbar { margin-bottom: 40px; }
    .back { color: #aaa; text-decoration: none; font-size: 14px; }
    .back:hover { color: #fff; }
    .content { max-width: 800px; margin: 0 auto; text-align: center; }
    .badge { display: inline-block; background: #1a237e; color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-bottom: 16px; }
    h1 { font-size: 36px; margin: 0 0 12px; }
    .subtitle { color: #aaa; font-size: 16px; margin: 0 0 48px; }
    .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
    .feature-card { background: #252526; border: 1px solid #1a237e; border-radius: 12px; padding: 28px; text-align: left; }
    .icon { font-size: 28px; margin-bottom: 12px; }
    h3 { margin: 0 0 8px; font-size: 16px; }
    p { color: #aaa; font-size: 14px; margin: 0; line-height: 1.5; }
    .coming-soon { background: #252526; border: 1px solid #333; border-radius: 10px; padding: 20px; color: #555; font-size: 14px; }
  `],
})
export class EnterpriseComponent {}
