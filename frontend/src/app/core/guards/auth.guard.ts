import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Blocks access to private routes if user is not logged in
// Also redirects to /setup if onboarding not completed
export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  const user = authService.user();
  // Allow /setup itself to pass through, avoid infinite redirect
  const targetPath = route.routeConfig?.path ?? '';
  if (!user?.setupCompleted && targetPath !== 'setup') {
    router.navigate(['/setup']);
    return false;
  }

  return true;
};
