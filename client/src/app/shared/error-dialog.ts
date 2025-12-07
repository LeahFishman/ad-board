import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Connection problem</h2>
    <div mat-dialog-content>
      <p>{{ data.message ?? 'Unable to load ads. The server may be down.' }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="dialogRef.close()">Dismiss</button>
    </div>
  `
})
export class ErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message?: string }
  ) {}
}
