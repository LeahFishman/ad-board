import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-ad-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  styleUrls: ['./add-ad-dialog.scss'],
  template: `
    <section class="ad-form" aria-label="Add a new ad">
      <h2 class="ad-form__title">Add a new post</h2>
      <form [formGroup]="form" (ngSubmit)="submit()" class="ad-form__grid">
        <mat-form-field appearance="outline" class="ad-form__field ad-form__field--half">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="What are you offering?" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="ad-form__field ad-form__field--half ad-form__field--inline-textarea">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="1" placeholder="Describe your post"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="ad-form__field ad-form__field--half">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            <mat-option *ngFor="let c of data.categories" [value]="c">{{ c }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="ad-form__field ad-form__field--half">
          <mat-label>Area label</mat-label>
          <input matInput formControlName="locationLabel" placeholder="Neighborhood or area" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="ad-form__field ad-form__field--full">
          <mat-label>Image URL</mat-label>
          <input matInput formControlName="imageUrl" placeholder="https://..." />
        </mat-form-field>
        <div class="ad-form__actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Create</button>
          <button mat-stroked-button type="button" (click)="dialogRef.close()">Cancel</button>
        </div>
      </form>
    </section>
  `
})
export class AddAdDialogComponent {
  form: FormGroup;
  constructor(
    private fb: NonNullableFormBuilder,
    public dialogRef: MatDialogRef<AddAdDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categories: string[] }
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      category: [data.categories[0] ?? '', [Validators.required]],
      locationLabel: [''],
      imageUrl: ['']
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
