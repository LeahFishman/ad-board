import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-edit-ad-dialog',
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
    MatSlideToggleModule
  ],
  templateUrl: './edit-ad-dialog.html',
  styleUrl: './edit-ad-dialog.scss'
})
export class EditAdDialogComponent implements AfterViewInit {
  form: FormGroup;
  @ViewChild('editAreaInput', { static: false }) editAreaInput!: ElementRef<HTMLInputElement>;
  constructor(
    private fb: NonNullableFormBuilder,
    public dialogRef: MatDialogRef<EditAdDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categories: string[]; ad: any }
  ) {
    const ad = data.ad || {};
    this.form = this.fb.group({
      title: [ad.title ?? '', [Validators.required, Validators.minLength(2)]],
      description: [ad.shortDescription ?? ad.description ?? '', [Validators.required, Validators.minLength(5)]],
      imageUrl: [ad.imageUrl ?? ''],
      category: [ad.category ?? (data.categories?.[0] ?? ''), [Validators.required]],
      associateLocation: [false],
      locationLabel: [ad.location ?? ''],
      latitude: [ad.latitude ?? null],
      longitude: [ad.longitude ?? null]
    });

    const assoc = this.form.get('associateLocation');
    const area = this.form.get('locationLabel');
    assoc?.valueChanges.subscribe((on) => {
      if (on) {
        area?.disable({ emitEvent: false });
      } else {
        area?.enable({ emitEvent: false });
      }
    });
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue() as any;
    const assoc = !!raw.associateLocation;
    const finish = (lat: number | null, lng: number | null) => {
      this.dialogRef.close({
        title: raw.title,
        description: raw.description,
        imageUrl: raw.imageUrl,
        category: raw.category,
        locationLabel: raw.locationLabel,
        latitude: lat,
        longitude: lng
      });
    };
    if (assoc) {
      const lat = raw.latitude ?? null;
      const lng = raw.longitude ?? null;
      if (lat != null && lng != null) {
        finish(lat, lng);
        return;
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => finish(pos.coords.latitude, pos.coords.longitude),
          () => finish(null, null),
          { enableHighAccuracy: false, timeout: 5000 }
        );
      } else {
        finish(null, null);
      }
    } else {
      // Not associating current place: preserve coords if selected via autocomplete
      finish(raw.latitude ?? null, raw.longitude ?? null);
    }
  }

  ngAfterViewInit(): void {
    const inputEl = this.editAreaInput?.nativeElement;
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
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = inputEl.value || '';
        this.form.patchValue({ locationLabel: val });
      }
    });
  }
}