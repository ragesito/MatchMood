import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
  email: string | null;
  hasGithub: boolean;
  githubUsername: string | null;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  setupCompleted: boolean;
  preferredLang: string;
  skillLevel: string;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  theme: string;
  notifMatches: boolean;
  notifSummary: boolean;
  notifMilestone: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY   = 'mm_token';
  private readonly NUDGE_KEY   = 'mm_github_nudge';

  private _user = signal<User | null>(null);

  readonly user      = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  init(): Promise<void> {
    const token = this.getToken();
    if (!token) return Promise.resolve();

    return firstValueFrom(
      this.fetchProfile().pipe(
        catchError(() => {
          this.logout();
          return of(null);
        })
      )
    ).then(() => {});
  }

  // Used by GitHub OAuth callback
  handleCallback(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.fetchProfile().subscribe({
      next: (user) => {
        if (!user.setupCompleted) {
          this.router.navigate(['/setup']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => this.logout(),
    });
  }

  // Email/password register — sets nudge flag so dashboard shows the modal
  register(email: string, password: string): Observable<void> {
    return new Observable(observer => {
      this.http.post<{ token: string }>(`${environment.apiUrl}/auth/register`, { email, password })
        .subscribe({
          next: ({ token }) => {
            localStorage.setItem(this.NUDGE_KEY, '1');
            this.handleCallback(token);
            observer.next();
            observer.complete();
          },
          error: err => { observer.error(err); },
        });
    });
  }

  // Email/password login
  login(email: string, password: string): Observable<void> {
    return new Observable(observer => {
      this.http.post<{ token: string }>(`${environment.apiUrl}/auth/login`, { email, password })
        .subscribe({
          next: ({ token }) => {
            this.handleCallback(token);
            observer.next();
            observer.complete();
          },
          error: err => { observer.error(err); },
        });
    });
  }

  // Dashboard reads this once, then clears it
  shouldShowGithubNudge(): boolean {
    const has = localStorage.getItem(this.NUDGE_KEY) === '1';
    if (has) localStorage.removeItem(this.NUDGE_KEY);
    return has;
  }

  fetchProfile() {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => this._user.set(user))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._user.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
