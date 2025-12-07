import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker, GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-ad-location-picker',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './ad-location-picker.html',
  styleUrls: ['./ad-location-picker.scss']
})
export class AdLocationPickerComponent {
  @Input() initialLat?: number;
  @Input() initialLng?: number;
  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  zoom = 13;
  height = '280px';
  center: google.maps.LatLngLiteral = { lat: 32.0853, lng: 34.7818 };
  markerPosition?: google.maps.LatLngLiteral;

  ngOnInit() {
    if (typeof this.initialLat === 'number' && typeof this.initialLng === 'number') {
      this.center = { lat: this.initialLat, lng: this.initialLng };
      this.markerPosition = { lat: this.initialLat, lng: this.initialLng };
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    this.markerPosition = { lat, lng };
    this.locationSelected.emit({ lat, lng });
  }
}
