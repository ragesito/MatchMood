import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DailyChallenge, LeaderboardResponse, ProfileData, PublicProfile,
  RoomCreateResponse, UsernameAvailability,
} from '../models/api.models';

// Single HTTP layer for the backend. Components call these typed methods
// instead of injecting HttpClient and hand-writing URLs — so a wrong path
// (e.g. the old /api/rooms 404) can't be expressed, and there's one place to
// change the base URL or mock in tests.
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Challenges ──
  getDailyChallenge(): Observable<DailyChallenge> {
    return this.http.get<DailyChallenge>(`${this.base}/challenges/daily`);
  }

  // ── Leaderboard ──
  getLeaderboard(period: string, page: number, limit: number, language?: string): Observable<LeaderboardResponse> {
    const lang = language && language !== 'all' ? `&language=${language}` : '';
    return this.http.get<LeaderboardResponse>(
      `${this.base}/leaderboard?period=${period}&page=${page}&limit=${limit}${lang}`,
    );
  }

  // ── Profiles ──
  getMyProfile(): Observable<ProfileData> {
    return this.http.get<ProfileData>(`${this.base}/profile/me`);
  }

  getPublicProfile(username: string): Observable<PublicProfile> {
    return this.http.get<PublicProfile>(`${this.base}/users/${username}/public`);
  }

  // ── Account / settings ──
  checkUsername(username: string): Observable<UsernameAvailability> {
    return this.http.get<UsernameAvailability>(
      `${this.base}/auth/check-username?username=${encodeURIComponent(username)}`,
    );
  }

  updateAccount(data: { username?: string; preferredLang?: string }): Observable<unknown> {
    return this.http.patch(`${this.base}/settings/account`, data);
  }

  updatePreferences(data: Record<string, unknown>): Observable<unknown> {
    return this.http.patch(`${this.base}/settings/preferences`, data);
  }

  completeSetup(data: { preferredLang: string; skillLevel: string; username: string }): Observable<unknown> {
    return this.http.patch(`${this.base}/auth/setup`, data);
  }

  deleteAccount(): Observable<unknown> {
    return this.http.delete(`${this.base}/auth/account`);
  }

  // ── Private rooms ──
  createRoom(): Observable<RoomCreateResponse> {
    return this.http.post<RoomCreateResponse>(`${this.base}/rooms`, {});
  }

  getRoomReport(code: string): Observable<unknown> {
    return this.http.get(`${this.base}/rooms/${code}/report`);
  }

  // ── Billing ──
  createCheckout(tier: string, billing: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.base}/stripe/create-checkout`, { tier, billing });
  }
}
