import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Ad {
  id: string; // GUID from server
  title: string;
  shortDescription: string;
  category: string;
  location: string;
  createdAt: string;
  imageUrl?: string;
  userName?: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdsQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  location?: string;
}

export interface AdCreate {
  title: string;
  description: string;
  category: string;
  location: string;
  imageUrl?: string;
}

export interface AdUpdate {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AdsService {
  constructor(private http: HttpClient) {}

  getAds(params: AdsQueryParams): Observable<PagedResult<Ad>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.location) httpParams = httpParams.set('location', params.location);

    // Server controller: AdvertisementsController at /api/Advertisements
    return this.http.get<PagedResult<Ad>>(`${environment.baseApiUrl}/api/Advertisements`, { params: httpParams });
  }

  createAd(ad: AdCreate) {
    return this.http.post<Ad>(`${environment.baseApiUrl}/api/Advertisements`, ad);
  }

  deleteAd(id: string) {
    return this.http.delete<void>(`${environment.baseApiUrl}/api/Advertisements/${id}`);
  }

  updateAd(id: string, update: AdUpdate) {
    return this.http.put<Ad>(`${environment.baseApiUrl}/api/Advertisements/${id}`, update);
  }
}
