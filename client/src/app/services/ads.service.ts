import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retryWhen, scan, delayWhen } from 'rxjs';
import { timer, MonoTypeOperatorFunction } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ad } from '../shared/models/ad';
import { PagedResult } from '../shared/models/paged-result';
import { AdsQueryParams } from '../shared/models/ads-query-params';
import { AdCreate, AdUpdate } from '../shared/models/ad-change';

@Injectable({ providedIn: 'root' })
export class AdsService {
  constructor(private http: HttpClient) {}

  private retryBackoff<T>(): MonoTypeOperatorFunction<T> {
    const maxRetries = 3;
    const baseDelayMs = 750; // total ~ (0.75 + 1.5 + 3.0)s
    return retryWhen((errors) =>
      errors.pipe(
        scan((acc: { count: number; lastError: any }, err: any) => {
          const status = (err as any)?.status;
          const isTransient = status === 0 || (status >= 500 && status < 600);
          if (!isTransient) {
            // Non-transient (4xx/auth/validation) — stop retrying
            throw err;
          }
          const nextCount = acc.count + 1;
          if (nextCount > maxRetries) {
            throw err;
          }
          return { count: nextCount, lastError: err };
        }, { count: 0, lastError: null } as { count: number; lastError: any }),
        delayWhen((acc: { count: number }) => timer(acc.count * baseDelayMs))
      )
    );
  }

  getAds(params: AdsQueryParams): Observable<PagedResult<Ad>> {
    let httpParams = new HttpParams()
        .set('page', String(params.page))
        .set('pageSize', String(params.pageSize));
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.location) httpParams = httpParams.set('location', params.location);
    if (typeof params.lat === 'number' && typeof params.lng === 'number' && typeof params.radiusKm === 'number') {
      httpParams = httpParams.set('lat', String(params.lat)).set('lng', String(params.lng)).set('radiusKm', String(params.radiusKm));
    }

    return this.http.get<PagedResult<Ad>>(`${environment.baseApiUrl}/api/Advertisements`, { params: httpParams }).pipe(this.retryBackoff());
  }

  createAd(ad: AdCreate) {
    return this.http.post<Ad>(`${environment.baseApiUrl}/api/Advertisements`, ad).pipe(this.retryBackoff());
  }

  deleteAd(id: string) {
    return this.http.delete<void>(`${environment.baseApiUrl}/api/Advertisements/${id}`).pipe(this.retryBackoff());
  }

  updateAd(id: string, update: AdUpdate) {
    return this.http.put<Ad>(`${environment.baseApiUrl}/api/Advertisements/${id}`, update).pipe(this.retryBackoff());
  }
}
