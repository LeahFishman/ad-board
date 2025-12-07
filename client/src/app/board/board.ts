import { Component, ChangeDetectionStrategy, signal, TemplateRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormGroup } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { AdCreate, AdUpdate } from '../ads.service';
import { BoardFacade } from './board.facade';
import { AuthService } from '../auth.service';
import { CATEGORIES } from '../shared/categories';
// import { environment } from '../../environments/environment';
// Angular Material modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ErrorDialogComponent } from '../shared/error-dialog';
import { AddAdDialogComponent } from './add-ad-dialog';

@Component({
  selector: 'app-board',
  standalone: true,
  templateUrl: './board.html',
  styleUrl: './board.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
    , MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent {
  // Facade-backed streams
  readonly ads$: Observable<import('../ads.service').Ad[]>;
  readonly totalPages$: Observable<number>;
  readonly loading: any;
  readonly page: any;

  // Error popup state
  readonly errorMessage: any;
  // Inline create error (used by dialog submit feedback)
  readonly createError = signal<string | null>(null);
  readonly categories = CATEGORIES;
  editForm!: FormGroup;
  newAdForm!: FormGroup;

  trackById(_: number, item: { id: string }) { return item.id; }

  deleteAd(id: string) { if (id) this.facade.deleteAd(id); }
  readonly creating = signal(false);
  async addAd() {
    // If opened via standalone dialog, we expect the dialog result to have been passed instead
    if (this.newAdForm.invalid) return;
    const { title, description, category, locationLabel, imageUrl } = this.newAdForm.getRawValue() as { 
      title: string; 
      description: string; 
      category: string; 
      locationLabel: string; 
      imageUrl: string; 
    };
    const location = (locationLabel || '').trim();
    const payload: AdCreate = {
      title: title!,
      description: description!,
      category: category!,
      location,
      imageUrl: imageUrl || undefined
    };
    try {
      this.creating.set(true);
      const created = await this.facade.createAd(payload);
      this.dialog.closeAll();
      this.resetNewAdForm();
    } catch (e) {
      if (e && typeof e === 'object' && (e as any).status === 401) {
        const msg = 'Unauthorized: Please sign in to create a post.';
        this.errorMessage.set(msg);
        this.createError.set(msg);
      } else if (e && typeof e === 'object' && (e as any).status === 403) {
        const msg = 'Forbidden: Your account does not have permission to create posts.';
        this.errorMessage.set(msg);
        this.createError.set(msg);
      } else {
        const msg = 'Failed to create the post. Please ensure you are signed in with the correct role.';
        this.errorMessage.set(msg);
        this.createError.set(msg);
      }
    } finally {
      this.creating.set(false);
    }
  }

  resetNewAdForm() { this.newAdForm.reset({
    title: '',
    description: '',
    category: CATEGORIES[0]!,
    locationLabel: '',
    imageUrl: ''
  }); }

  currentUser = signal('you');

  canModify(ad: { userName?: string; createdBy?: string }) {
    const r = this.role();
    if (r === 'Admin') return true;
    if (r === 'Editor') {
      const owner = ad.userName ?? ad.createdBy;
      return owner === this.currentUser();
    }
    return false;
  }

  canAdd() {
    const r = this.role();
    // If role is missing (older accounts), allow add when authenticated
    return !!this.token() && (r === 'Admin' || r === 'Editor' || !r);
  }

  // delete/edit operations are out of scope for paged search demo

  editingId = signal<string | null>(null);

  async startEdit(adId: string) {
    this.editingId.set(adId);
    const ads = await firstValueFrom(this.ads$) as any[];
    const ad = ads.find((a: any) => a.id === adId);
    if (ad) {
      this.editForm.reset({
        title: ad.title ?? '',
        description: ad.shortDescription ?? ad.description ?? '',
        imageUrl: ad.imageUrl ?? '',
        category: ad.category ?? CATEGORIES[0]!,
        locationLabel: ad.location ?? ''
      });
    }
  }

  async saveEdit(adId: string) {
    if (this.editForm.invalid) return;
    const updated = this.editForm.getRawValue() as { 
      title: string; 
      description: string; 
      imageUrl: string; 
      category: string; 
      locationLabel: string; 
    };
    const payload: AdUpdate = {
      title: updated.title!,
      description: updated.description!,
      imageUrl: updated.imageUrl || undefined,
      category: updated.category!,
      location: updated.locationLabel || ''
    };
    try {
      await this.facade.updateAd(adId, payload);
      this.editingId.set(null);
    } catch (e: any) {
      if (e?.status === 401) {
        this.errorMessage.set('Unauthorized: Please sign in to edit posts.');
      } else if (e?.status === 403) {
        this.errorMessage.set('Forbidden: You do not have permission to edit this post.');
      } else {
        this.errorMessage.set('Failed to update the post.');
      }
    }
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  // Client-only auth state via AuthService signals
  private readonly auth = inject(AuthService);
  readonly token = this.auth.token;
  readonly loggedInUser = this.auth.userName;
  readonly role = this.auth.role;

  logout() {
    this.auth.logout();
    this.currentUser.set('you');
  }

  // On init, set auth-derived state if present
  private errorDialogOpen = signal(false);

  constructor(public dialog: MatDialog, public facade: BoardFacade, private fb: NonNullableFormBuilder) {
    // Initialize facade-backed properties
    this.ads$ = this.facade.ads$;
    this.totalPages$ = this.facade.totalPages$;
    this.loading = this.facade.loading;
    this.errorMessage = this.facade.errorMessage;
    this.page = this.facade.page;
    
    // Initialize forms after fb is available
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      imageUrl: [''],
      category: [CATEGORIES[0]!, [Validators.required]],
      locationLabel: ['']
    });

    this.newAdForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      category: [CATEGORIES[0]!, [Validators.required]],
      locationLabel: [''],
      imageUrl: ['']
    });
    
    const userName = this.loggedInUser();
    if (userName) this.currentUser.set(userName);
    // kick initial empty search
    this.facade.onSearchChange('');

    // Open a Material dialog when errorMessage is set
    effect(() => {
      const msg = this.errorMessage();
      const open = this.errorDialogOpen();
      if (msg && !open) {
        this.errorDialogOpen.set(true);
        const ref = this.dialog.open(ErrorDialogComponent, {
          data: {
            message: msg
          }
        });
        ref.afterClosed().subscribe(() => {
          this.closeError();
        });
      }
    });
  }

  openAddDialog() {
    if (!this.canAdd()) return;
    const ref = this.dialog.open(AddAdDialogComponent, { width: '640px', data: { categories: this.categories } });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.newAdForm.reset(result);
      this.addAd();
    });
  }

  onSearchChange(term: string) { this.facade.onSearchChange(term); }

  closeError() {
    try {
      // Clear the facade's error signal if writable
      const anyErr: any = this.errorMessage as any;
      if (anyErr && typeof anyErr.set === 'function') {
        anyErr.set(null);
      } else if (this.facade && typeof (this.facade as any).clearError === 'function') {
        (this.facade as any).clearError();
      }
    } catch {}
    this.errorDialogOpen.set(false);
    this.dialog.closeAll();
  }

  changeLocation(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    const value = (target?.value ?? '').trim();
    this.facade.changeLocation(value === '' ? null : value);
  }
  
  nextPage() { this.facade.nextPage(); }

  prevPage() { this.facade.prevPage(); }
}
