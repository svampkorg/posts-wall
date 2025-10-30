import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule, MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';

@Component({
  selector: 'error-dialog',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatButton,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
],
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDialogComponent {
  public data: string = inject(MAT_DIALOG_DATA);
}
