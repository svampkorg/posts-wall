import { computed, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { User } from './user.model';
import { HttpClient } from '@angular/common/http';
import { AuthData } from './auth-data.model';
import LocalStorageService from './local-storage-service';
import JwtTokenService, { TOKEN_KEY } from './jwt-token-service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
const BASE_URL = environment.baseUrl;

export interface UserStatus<T> {
  data: T | null;
  loading: boolean;
  token: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private authState = signal<UserStatus<User>>({
    data: null,
    token: null,
    loading: false,
  });
  private localStorage = inject(LocalStorageService);
  private router = inject(Router);
  private jwtTokenService = inject(JwtTokenService);
  private tokenTimer: NodeJS.Timeout | null = null;

  constructor() {
    effect(() => {
      console.log('AuthService constructor effect');
      const token = this.token();
      if (token) {
        console.log('   - AuthService constructor effect - token!');
        this.setLogoutTimer(this.jwtTokenService.getRemainingTokenDurationSeconds(token));
        this.getUser();
      } else {
        console.log('   - AuthService constructor effect - no token');
      }
    });
  }

  public readonly token: Signal<string | null> = computed(() => this.authState().token);
  public readonly user: Signal<User | null> = computed(() => this.authState().data);
  public readonly loading: Signal<boolean> = computed(() => this.authState().loading);
  public readonly name: Signal<string | undefined | null> = computed(
    () => this.authState().data?.name,
  );

  isAuthor(author: string): boolean {
    return (this.authState().data?.id ?? '!¡!¡') === author;
  }

  restoreSavedAuthTokenData() {
    console.log('setupTokenFromLocalStorage');
    const token = this.localStorage.get(TOKEN_KEY);
    if (!token) {
      this.logout();
      return;
    }
    this.authState.update((state) => ({
      ...state,
      token: token,
    }));
  }

  isAuthenticated() {
    if (this.token()) {
      return true;
    }
    return false;
  }

  logout() {
    console.log('logout');
    this.resetLogoutTimer();
    this.authState.update((state) => ({
      ...state,
      token: null,
      data: null,
      loading: false,
    }));
    this.clearSavedAuthTokenData();
    this.navigateToRoot();
  }

  private saveAuthTokenData(token: string) {
    this.localStorage.set(TOKEN_KEY, token);
  }

  private clearSavedAuthTokenData() {
    this.localStorage.remove(TOKEN_KEY);
  }

  private setLogoutTimer(seconds: number | undefined) {
    console.log('setLogoutTimer');
    if (!seconds) return;
    console.log('-    first reset before set');
    this.resetLogoutTimer();
    console.log('-    Setting logout timer seconds: ', seconds);
    this.tokenTimer = setTimeout(() => {
      console.log('Logout timer callback');
      this.logout();
    }, seconds * 1000);
  }

  private resetLogoutTimer() {
    console.log('resetLogoutTimer');
    if (this.tokenTimer) {
      console.log('   - Resetting logout timer');
      clearTimeout(this.tokenTimer);
    }
  }

  createUser(email: string, password: string) {
    const authData: AuthData = {
      email: email,
      password: password,
    };
    this.http
      .post<{
        message: string;
        token: string;
        user: { email: string; id: string; name: string };
      }>(`${BASE_URL}/user/signup`, authData)
      .subscribe({
        next: (response) => {
          console.log(response.message);
          console.log('Token: ', response.token);
          this.authState.update((state) => ({
            ...state,
            token: response.token,
            loading: false,
            data: { email: response.user.email, id: response.user.id, name: response.user.name },
          }));
          this.saveAuthTokenData(response.token);
        },
        error: (err) => {
          console.error('createUser error: ', err.error.message);
        },
        complete: () => {
          console.log('createUser complete');

          this.navigateToRoot();
        },
      });
  }

  loginUser(email: string, password: string) {
    const authData: AuthData = {
      email: email,
      password: password,
    };
    this.http
      .post<{
        message: string;
        token: string;
        user: { email: string; id: string; name: string };
      }>(`${BASE_URL}/user/login`, authData)
      .subscribe({
        next: (response) => {
          console.log(response.message);
          console.log('Token: ', response.token);
          this.authState.update((state) => ({
            ...state,
            token: response.token,
            loading: false,
            data: { email: response.user.email, id: response.user.id, name: response.user.name },
          }));
          this.saveAuthTokenData(response.token);
        },
        error: (err) => {
          console.error('loginUser error: ', err);
        },
        complete: () => {
          console.log('Login completed');

          this.navigateToRoot();
        },
      });
  }

  changeName(name: string, callback: () => void) {
    console.log('AuthService - changeName');
    this.setLoading();
    this.http
      .patch<{
        message: string;
        name: string;
      }>(`${BASE_URL}/user/name`, { name: name })
      .subscribe({
        next: (response) => {
          console.log(response.message);
          this.authState.update((state) => ({
            ...state,
            data: {
              id: state.data?.id ?? '',
              email: state.data?.email ?? '',
              name: response.name,
            },
            loading: false,
          }));
        },
        error: (err) => {
          console.error('changeName error: ', err);
        },
        complete: () => {
          console.log('Change name completed');
          callback();
          this.setLoading(false);
        },
      });
  }

  private getUser() {
    this.setLoading();
    this.http
      .get<{
        message: string;
        user: { email: string; id: string; name: string };
      }>(`${BASE_URL}/user`)
      .subscribe({
        next: (response) => {
          this.authState.update((state) => ({
            ...state,
            loading: false,
            data: { email: response.user.email, id: response.user.id, name: response.user.name },
          }));
        },
        error: (err) => {
          console.error('getUser error: ', err);
        },
        complete: () => {
          console.log('Done getting user');
          this.setLoading(false);
        },
      });
  }

  private setLoading(loading: boolean = true) {
    this.authState.update((state) => ({
      ...state,
      loading: loading,
    }));
  }

  private navigateToRoot() {
    this.router.navigateByUrl('/');
  }
}
