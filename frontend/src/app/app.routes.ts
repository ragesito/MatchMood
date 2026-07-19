import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { tierGuard } from './core/guards/tier.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/callback.component').then((m) => m.CallbackComponent),
  },
  {
    path: 'setup',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/setup/setup.component').then((m) => m.SetupComponent),
  },
  {
    // Shell has no guard of its own — public routes (e.g. /u/:username)
    // render inside it without a sidebar, authed children guard themselves.
    path: '',
    loadComponent: () =>
      import('./shared/components/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'subscription',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/subscription/subscription.component').then((m) => m.SubscriptionComponent),
      },
      {
        path: 'subscription/success',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/subscription/success.component').then((m) => m.SuccessComponent),
      },
      {
        path: 'arena',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/arena/arena.component').then((m) => m.ArenaComponent),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'enterprise',
        canActivate: [tierGuard(['ENTERPRISE'])],
        loadComponent: () =>
          import('./features/enterprise/enterprise.component').then((m) => m.EnterpriseComponent),
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'leaderboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
      },
      {
        // Public — no guard. Gets the sidebar when logged in, standalone when not.
        path: 'u/:username',
        loadComponent: () =>
          import('./features/public-profile/public-profile.component').then((m) => m.PublicProfileComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
