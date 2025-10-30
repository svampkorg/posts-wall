import {  HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';

export const authenticationInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const token = inject(AuthService).token();

  if (token) {
    const authRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(authRequest);
  }

  return next(req);
};
