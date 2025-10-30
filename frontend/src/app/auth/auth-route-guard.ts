import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from './auth.service';
import JwtTokenService from './jwt-token-service';

export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const jwtTokenService = inject(JwtTokenService);
  const token = authService.token();

  const isExpired = !jwtTokenService.isTokenExpired(token);
  console.log('Token expired? ', isExpired);
  if (authService.isAuthenticated() && !isExpired) {
    return true;
  }
  const loginPath = router.parseUrl('/login');
  return new RedirectCommand(loginPath, {
    skipLocationChange: true,
  });
};
