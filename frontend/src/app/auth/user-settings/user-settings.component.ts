import { Component, effect, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';

interface UserSettingsData {
  // user: User | null;
  name: string;
}
// no need for selector.
// It will be loaded via routing
@Component({
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinner,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.css'],
})
export class UserSettingsComponent {
  public userSettingsData = signal<UserSettingsData>({ name: '' });
  public authService = inject(AuthService);

  public isLoading = this.authService.loading;
  public name = this.authService.name;
  public hasChangedName = signal<boolean>(false);

  form: FormGroup;
  constructor() {
    this.form = new FormGroup({
      name: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(3)],
      }),
    });

    effect(() => {
      const name = this.name();
      console.log('constructor effect name: ', name);
      this.form.patchValue({ name: name });
      this.form.get('name')?.updateValueAndValidity();
    });
  }

  onNameChanged(event: Event) {
    // console.log('on name changed ', event.target);
    this.form.patchValue({ name: (event.target as HTMLInputElement).value });
    this.form.get('name')?.updateValueAndValidity();
  }

  changeSettings() {
    if (this.form.invalid) {
      console.log('FormData invalid');
      return;
    } else {
      this.authService.changeName(this.form.get('name')?.value, () => {
        this.hasChangedName.set(true);
      });
    }
  }
}
