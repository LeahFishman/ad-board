import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { GoogleMapsModule } from '@angular/google-maps';
import { AdLocationPickerComponent } from './ad-location-picker';

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
    MatButtonModule,
    GoogleMapsModule,
    AdLocationPickerComponent
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
          <mat-label>Associate current place</mat-label>
          <mat-select formControlName="associateLocation">
            <mat-option [value]="true">Yes</mat-option>
            <mat-option [value]="false">No</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="ad-form__field ad-form__field--half">
          <mat-label>Area label</mat-label>
          <input #areaInput matInput formControlName="locationLabel" placeholder="Neighborhood or area" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="ad-form__field ad-form__field--full">
          <mat-label>Image URL</mat-label>
          <input matInput formControlName="imageUrl" placeholder="https://..." />
        </mat-form-field>
        <section class="ad-form__field ad-form__field--full">
          <h3 class="ad-form__subtitle">Location</h3>
          <app-ad-location-picker
            [initialLat]="form.get('latitude')?.value ?? undefined"
            [initialLng]="form.get('longitude')?.value ?? undefined"
            (locationSelected)="onLocationSelected($event)">
          </app-ad-location-picker>
          <div class="ad-form__coords" *ngIf="form.get('latitude')?.value as lat">
            <span>Lat: {{ lat }}</span>
            <span>Lng: {{ form.get('longitude')?.value }}</span>
          </div>
        </section>
        <div class="ad-form__actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Create</button>
          <button mat-stroked-button type="button" (click)="dialogRef.close()">Cancel</button>
        </div>
      </form>
    </section>
  `
})
export class AddAdDialogComponent implements AfterViewInit {
  form: FormGroup;
  @ViewChild('areaInput', { static: false }) areaInput!: ElementRef<HTMLInputElement>;
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
      imageUrl: [''],
      associateLocation: [true],
      latitude: [null as number | null],
      longitude: [null as number | null]
    });

    const associateCtrl = this.form.get('associateLocation');
    const areaCtrl = this.form.get('locationLabel');
    if (associateCtrl && areaCtrl) {
      if (associateCtrl.value === true) areaCtrl.disable({ emitEvent: false });
      associateCtrl.valueChanges.subscribe((v: boolean) => {
        if (v === true) areaCtrl.disable();
        else areaCtrl.enable();
      });
    }
  }

  async submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue() as { associateLocation: boolean; latitude: number | null; longitude: number | null } & Record<string, any>;
    if (raw.associateLocation) {
      // If associating and coordinates are missing, try to use current device location.
      if ((raw.latitude == null || raw.longitude == null) && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 5000 })
          );
          raw.latitude = pos.coords.latitude;
          raw.longitude = pos.coords.longitude;
        } catch {}
      }
    } else {
      // Not associating: if coordinates were set via Autocomplete or map, keep them.
      // Only clear when no coordinates exist.
      if (raw.latitude == null && raw.longitude == null) {
        raw.latitude = null;
        raw.longitude = null;
      }
    }
    this.dialogRef.close(raw);
  }

  onLocationSelected(evt: { lat: number; lng: number }) {
    this.form.patchValue({ latitude: evt.lat, longitude: evt.lng });
  }

  ngAfterViewInit(): void {
    const inputEl = this.areaInput?.nativeElement;
    const g = (window as any).google as any;
    if (!inputEl || !g || !g.maps || !g.maps.places) return;
    const autocomplete = new g.maps.places.Autocomplete(inputEl, {
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['geocode']
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return;
      const formatted = place.formatted_address || place.name || '';
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      this.form.patchValue({ locationLabel: formatted, latitude: lat, longitude: lng });
    });

    // Handle manual enter submissions: update label only
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = inputEl.value || '';
        this.form.patchValue({ locationLabel: val });
      }
    });
  }
}
