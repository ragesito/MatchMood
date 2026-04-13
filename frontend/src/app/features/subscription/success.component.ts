import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="text-align:center; padding:80px 24px; background:#1e1e1e; min-height:100vh; color:#fff;">
      <div style="font-size:64px;">🎉</div>
      <h1 style="color:#4caf50;">You're now Premium!</h1>
      <p style="color:#aaa;">Your badge and features are now active.</p>
      <a routerLink="/dashboard" style="display:inline-block; margin-top:24px; padding:12px 32px; background:#0e7a0d; color:#fff; border-radius:8px; text-decoration:none;">Go to Dashboard</a>
    </div>
  `,
})
export class SuccessComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Refresh profile to get updated tier
    this.authService.fetchProfile().subscribe();
  }
}
