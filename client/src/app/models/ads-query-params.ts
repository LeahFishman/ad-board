export interface AdsQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  location?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}
