import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Factory function — returns a guard that allows access only if the user has
// one of the required tiers. Redirects to /subscription if not.
export function tierGuard(
  requiredTiers: ('PREMIUM' | 'ENTERPRISE')[]
): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.user();
    if (!user) {
      router.navigate(['/']);
      return false;
    }

    if (requiredTiers.includes(user.tier as any)) {
      return true;
    }

    // Redirect to subscription page so the user can upgrade
    router.navigate(['/subscription']);
    return false;
  };
}
