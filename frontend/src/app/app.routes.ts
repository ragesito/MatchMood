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
    path: 'u/:username',
    loadComponent: () =>
      import('./features/public-profile/public-profile.component').then((m) => m.PublicProfileComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'subscription',
        loadComponent: () =>
          import('./features/subscription/subscription.component').then((m) => m.SubscriptionComponent),
      },
      {
        path: 'subscription/success',
        loadComponent: () =>
          import('./features/subscription/success.component').then((m) => m.SuccessComponent),
      },
      {
        path: 'arena',
        loadComponent: () =>
          import('./features/arena/arena.component').then((m) => m.ArenaComponent),
      },
      {
        path: 'profile',
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
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'leaderboard',
        loadComponent: () =>
          import('./features/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
