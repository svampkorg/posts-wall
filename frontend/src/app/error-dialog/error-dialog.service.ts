import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog.component';

@Injectable({ providedIn: 'root' })
export class ErrorDialogService {
  public dialog: MatDialog;
  public isDialogOpen: boolean = false;
  constructor(dialog: MatDialog) {
    this.dialog = dialog;
  }

  openDialog(data: string): any {
    if (this.isDialogOpen) {
      return false;
    }

    this.isDialogOpen = true;

    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      panelClass: 'error-dialog',
      data: data,
    });

    dialogRef.afterClosed().subscribe((_result) => {
      this.isDialogOpen = false;
    });
  }
}
