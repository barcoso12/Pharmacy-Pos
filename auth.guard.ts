import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { UserRole } from '../models/user.model';
import { NotificationService } from '../core/services/notification.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (!authService.isLoggedIn) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const requiredRoles = route.data['roles'] as Array<UserRole> | undefined;

  // If logged in, check roles
  if (requiredRoles && requiredRoles.length > 0) {
    if (authService.hasRole(requiredRoles)) {
      return true; // User has one of the required roles
    } else {
      notificationService.show('You do not have permission to access this page.', 'error');
      router.navigate(['/dashboard']); // Redirect to a default safe page
      return false;
    }
  }

  // Logged in and no specific roles are required for the route
  return true;
};