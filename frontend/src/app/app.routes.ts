import { Routes } from '@angular/router';
import { PostListComponent } from './posts/post-list/post-list.component';
import { authGuard } from './auth/auth-route-guard';

export const routes: Routes = [
  {
    path: '',
    component: PostListComponent,
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./posts/post-create/post-create.component').then(
        (module) => module.PostCreateComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./posts/post-create/post-create.component').then(
        (module) => module.PostCreateComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((module) => module.LoginComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./auth/user-settings/user-settings.component').then(
        (module) => module.UserSettingsComponent,
      ),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/' },
];
