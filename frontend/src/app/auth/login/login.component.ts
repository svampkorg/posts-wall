import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MatCheckbox } from '@angular/material/checkbox';
import LocalStorageService from '../local-storage-service';
import { TOKEN_KEY } from '../jwt-token-service';

interface LoginFormData {
  email: string;
  password: string;
}
// no need for selector.
// It will be loaded via routing
@Component({
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinner,
    MatInputModule,
    FormsModule,
    MatCheckbox,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  public loginFormData = signal<LoginFormData>({ email: '', password: '' });

  private authService = inject(AuthService);
  private localStorageService = inject(LocalStorageService);
  public isLoading = this.authService.loading;
  public isSignup = signal<boolean>(false);

  constructor() {
    this.localStorageService.remove(TOKEN_KEY);
  }

  public loginButtonText = computed(() => {
    if (this.isSignup()) {
      return 'Signup';
    } else {
      return 'Login';
    }
  });

  onLogin(formData: NgForm) {
    if (formData.invalid) {
      console.log('FormData invalid');
      return;
    }
    if (this.isSignup()) {
      this.authService.createUser(formData.value.email, formData.value.password);
      formData.resetForm();
    } else {
      this.authService.loginUser(formData.value.email, formData.value.password);
      formData.resetForm();
    }
  }
}
