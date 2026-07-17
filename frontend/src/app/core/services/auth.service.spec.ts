import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService, User } from './auth.service';
import { environment } from '../../../environments/environment';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1', username: 'alice', avatarUrl: null, email: 'a@x.com',
    hasGithub: false, githubUsername: null, tier: 'FREE', rating: 1000,
    wins: 0, losses: 0, draws: 0, setupCompleted: true, preferredLang: 'javascript',
    skillLevel: 'medium', currentStreak: 0, longestStreak: 0, lastPlayedDate: null,
    theme: 'dark', notifMatches: true, notifSummary: true, notifMilestone: true,
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts logged out', () => {
    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('fetchProfile stores the user in the signal', () => {
    const user = makeUser();
    service.fetchProfile().subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(user);

    expect(service.user()).toEqual(user);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('logout clears the token, the user signal, and redirects home', () => {
    localStorage.setItem('mm_token', 'tok');
    service.fetchProfile().subscribe();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(makeUser());

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.user()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('shouldShowGithubNudge fires once then clears', () => {
    localStorage.setItem('mm_github_nudge', '1');
    expect(service.shouldShowGithubNudge()).toBeTrue();
    expect(service.shouldShowGithubNudge()).toBeFalse();
  });

  it('init() with no token makes no request', async () => {
    await service.init();
    http.expectNone(`${environment.apiUrl}/auth/me`);
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('init() logs out when the profile request fails', async () => {
    localStorage.setItem('mm_token', 'stale');
    const done = service.init();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(
      { error: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' },
    );
    await done;
    expect(service.getToken()).toBeNull();
    expect(service.user()).toBeNull();
  });
});
