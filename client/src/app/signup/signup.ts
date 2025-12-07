import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  imports: [CommonModule, FormsModule, RouterLink]
})
export class SignUpComponent {
  readonly userName = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  async submit() {
    this.error.set(null);
    this.success.set(null);
    if (this.password() !== this.confirmPassword()) {
      this.error.set('Passwords do not match');
      return;
    }
    this.loading.set(true);
    try {
      // Assuming a signup endpoint exists; adjust path if different on server
      const res = await fetch(`${environment.baseApiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: this.userName(), password: this.password() })
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({ message: 'Signup failed' }));
        throw new Error(msg.message || 'Signup failed');
      }
      this.success.set('Account created. Redirecting to sign in…');
      const u = encodeURIComponent(this.userName());
      setTimeout(() => location.assign(`/login?u=${u}`), 800);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Signup error');
    } finally {
      this.loading.set(false);
    }
  }
}
