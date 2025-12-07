import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';
import { importProvidersFrom } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers!,
    importProvidersFrom(GoogleMapsModule)
  ]
}).catch((err) => console.error(err));
