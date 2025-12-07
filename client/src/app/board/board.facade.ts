import { Injectable, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subject, combineLatest, of, Observable } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { startWith } from 'rxjs';
import { AdsService } from '../services/ads.service';
import { Ad } from '../shared/models/ad';
import { PagedResult } from '../shared/models/paged-result';
import { AdCreate, AdUpdate } from '../shared/models/ad-change';

@Injectable({ providedIn: 'root' })
export class BoardFacade {
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly categoryFilter = signal<string | null>(null);
  readonly locationFilter = signal<string | null>(null);
  readonly currentLat = signal<number | null>(null);
  readonly currentLng = signal<number | null>(null);
  readonly radiusKm = signal<number>(5);
  readonly searchTerm = new BehaviorSubject<string>('');
  private readonly refresh$ = new Subject<void>();

  readonly debouncedSearch$ = this.searchTerm.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(this.searchTerm.getValue())
  );

  readonly errorMessage = signal<string | null>(null);
  readonly removedIds = signal<Set<string>>(new Set<string>());
  readonly editedOverlay = signal<Record<string, Partial<Ad>>>({});
  readonly createdItems = signal<Ad[]>([]);

  readonly adsResult$: Observable<PagedResult<Ad>> = combineLatest([
    this.debouncedSearch$,
    toObservable(this.page),
    toObservable(this.pageSize),
    toObservable(this.categoryFilter),
    toObservable(this.locationFilter),
    toObservable(this.currentLat),
    toObservable(this.currentLng),
    toObservable(this.radiusKm),
    this.refresh$.pipe(startWith(undefined))
  ]).pipe(
    tap(() => this.loading.set(true)),
    switchMap(([search, page, pageSize, category, location, lat, lng, radiusKm]) =>
      this.ads.getAds({
        search: (search ?? '').trim(),
        page,
        pageSize,
        category: category ?? undefined,
        location: location ?? undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        radiusKm: lat != null && lng != null && radiusKm != null ? radiusKm as number : undefined
      })
    ),
    tap(() => { this.errorMessage.set(null); this.loading.set(false); }),
    catchError(err => {
      if (err && typeof err === 'object' && (err.status === 401 || err.status === 403)) {
        this.errorMessage.set('You are not authorized to view these ads. Please sign in.');
      } else {
        this.errorMessage.set('Unable to load ads. The server may be down.');
      }
      this.loading.set(false);
      return of({ items: [], totalCount: 0, page: this.page(), pageSize: this.pageSize() } as PagedResult<Ad>);
    }),
    shareReplay(1)
  );

  readonly ads$: Observable<Ad[]> = combineLatest([
    this.adsResult$,
    toObservable(this.removedIds),
    toObservable(this.editedOverlay),
    toObservable(this.createdItems),
    toObservable(this.page)
  ]).pipe(
    map(([r, removed, overlay, created, page]) => {
      const base = r.items
        .filter((item: Ad) => !removed.has(item.id))
        .map((item: Ad) => ({ ...item, ...(overlay[item.id] || {}) }));
      if (page === 1 && created.length) {
        const notDuplicate = created
          .filter(c => !removed.has(c.id))
          .filter(c => !base.some((b: Ad) => b.id === c.id));
        return [...notDuplicate, ...base];
      }
      return base;
    })
  );

  readonly totalCount$: Observable<number> = this.adsResult$.pipe(map(r => r.totalCount));
  readonly totalPages$: Observable<number> = this.totalCount$.pipe(map(total => Math.max(1, Math.ceil((total ?? 0) / this.pageSize()))));

  constructor(private ads: AdsService) {}
  // Force re-fetch of ads with current filters/page
  refresh() {
    this.refresh$.next();
  }

  private applyOverlayUpdate(adId: string, data: Partial<Ad>) {
    const overlay = { ...this.editedOverlay() };
    overlay[adId] = {
      title: data.title ?? overlay[adId]?.title,
      shortDescription: (data as any).shortDescription ?? overlay[adId]?.shortDescription,
      imageUrl: data.imageUrl ?? overlay[adId]?.imageUrl,
      category: data.category ?? overlay[adId]?.category,
      location: (data as any).location ?? overlay[adId]?.location
    };
    this.editedOverlay.set(overlay);
  }

  private updateCreatedItem(adId: string, data: Partial<Ad>) {
    const created = this.createdItems();
    if (!created.length) return;
    this.createdItems.set(created.map(c => c.id === adId ? { ...c, ...data } : c));
  }

  private removeFromCreated(id: string) {
    const created = this.createdItems();
    if (!created.length) return;
    this.createdItems.set(created.filter(c => c.id !== id));
  }

  onSearchChange(term: string) {
    this.page.set(1);
    this.searchTerm.next(term ?? '');
  }
  // no refresh method; Retry removed
  changeCategory(value: string | null) {
    this.page.set(1);
    this.categoryFilter.set((value ?? '').trim() === '' ? null : value);
  }
  changeLocation(value: string | null) {
    this.page.set(1);
    this.locationFilter.set((value ?? '').trim() === '' ? null : value);
  }
  setLocationFilter(lat: number, lng: number, radiusKm: number | null | undefined) {
    this.currentLat.set(lat);
    this.currentLng.set(lng);
    this.radiusKm.set((radiusKm ?? null) as any);
    this.page.set(1);
    this.searchTerm.next(this.searchTerm.getValue() || '');
  }
  nextPage() { this.page.update(p => p + 1); }
  prevPage() { this.page.update(p => Math.max(1, p - 1)); }

  async deleteAd(id: string) {
    // Optimistically remove from UI
    const prev = this.removedIds();
    const optimistic = new Set(prev);
    optimistic.add(id);
    this.removedIds.set(optimistic);
    try {
      await this.ads.deleteAd(id).toPromise();
      this.removeFromCreated(id);
      // Optionally refresh from server to reflect backend state
      this.refresh();
    } catch (e: any) {
      // Rollback on error
      const rollback = new Set(this.removedIds());
      rollback.delete(id);
      this.removedIds.set(rollback);
      if (e?.status === 401) this.errorMessage.set('Unauthorized: Please sign in to delete posts.');
      else if (e?.status === 403) this.errorMessage.set('Forbidden: You do not have permission to delete this post.');
      else this.errorMessage.set('Failed to delete the post.');
    }
  }

  async createAd(payload: AdCreate) {
    try {
      const created = await this.ads.createAd(payload).toPromise();
      if (created) {
        const current = this.createdItems();
        this.createdItems.set([created, ...current]);
        this.page.set(1);
      }
      this.searchTerm.next(this.searchTerm.getValue() || '');
      // Keep in sync with backend list
      this.refresh();
      return created;
    } catch (e: any) {
      if (e?.status === 401) this.errorMessage.set('Unauthorized: Please sign in to create a post.');
      else if (e?.status === 403) this.errorMessage.set('Forbidden: Your account does not have permission to create posts.');
      else this.errorMessage.set('Failed to create the post. Please ensure you are signed in with the correct role.');
      throw e;
    }
  }

  async updateAd(adId: string, payload: AdUpdate) {
    // Optimistic overlay so UI updates immediately
    const prevOverlay = { ...this.editedOverlay() };
    this.applyOverlayUpdate(adId, {
      title: payload.title,
      shortDescription: payload.description ?? '',
      imageUrl: payload.imageUrl,
      category: payload.category,
      location: payload.location
    } as any);
    try {
      const res = await this.ads.updateAd(adId, payload).toPromise();
      this.applyOverlayUpdate(adId, {
        title: res?.title ?? payload.title,
        shortDescription: res?.shortDescription ?? (payload.description ?? ''),
        imageUrl: res?.imageUrl ?? payload.imageUrl,
        category: res?.category ?? payload.category,
        location: res?.location ?? payload.location
      } as any);
      this.updateCreatedItem(adId, {
        title: res?.title ?? payload.title,
        shortDescription: res?.shortDescription ?? (payload.description ?? ''),
        imageUrl: res?.imageUrl ?? payload.imageUrl,
        category: res?.category ?? payload.category,
        location: res?.location ?? payload.location
      } as any);
      // Refresh to ensure server state (e.g., computed fields) are reflected
      this.refresh();
      return res;
    } catch (e: any) {
      // Roll back optimistic change on error
      this.editedOverlay.set(prevOverlay);
      if (e?.status === 401) this.errorMessage.set('Unauthorized: Please sign in to edit posts.');
      else if (e?.status === 403) this.errorMessage.set('Forbidden: You do not have permission to edit this post.');
      else this.errorMessage.set('Failed to update the post.');
      throw e;
    }
  }
}
