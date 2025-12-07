import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'token';
  private readonly roleKey = 'role';
  private readonly userNameKey = 'userName';

  // Signal-based auth state
  readonly token = signal<string | null>(localStorage.getItem(this.tokenKey));
  readonly userName = signal<string | null>(localStorage.getItem(this.userNameKey));
  readonly role = signal<string | null>(localStorage.getItem(this.roleKey));
  readonly isAuthenticated = computed(() => !!this.token());

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.baseApiUrl}/api/auth/login`, credentials);
  }

  // Centralized setter to update signals and persistence
  setAuth(token: string | null, userName: string | null, role: string | null): void {
    if (token) localStorage.setItem(this.tokenKey, token); else localStorage.removeItem(this.tokenKey);
    if (userName) localStorage.setItem(this.userNameKey, userName); else localStorage.removeItem(this.userNameKey);
    if (role) localStorage.setItem(this.roleKey, role); else localStorage.removeItem(this.roleKey);
    this.token.set(token);
    this.userName.set(userName);
    this.role.set(role);
  }

  // Deprecated legacy helper; removed to avoid duplicate patterns

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    this.setAuth(null, null, null);
  }
}
