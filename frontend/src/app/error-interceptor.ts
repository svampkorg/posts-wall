// import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs';
import { ErrorDialogService } from './error-dialog/error-dialog.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const dialogService = inject(ErrorDialogService);
  return next(req).pipe(
    catchError((err, _caught) => {
      console.error('Caught error: ', err.error.message);
      if (err.error.message) {
        // alert(err.error.message);
        dialogService.openDialog(err.error.message);
      }
      return next(req);
    }),
  );
};
