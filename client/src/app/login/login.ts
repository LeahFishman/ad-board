import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss',
  imports: [CommonModule, FormsModule, RouterLink]
})
export class LoginComponent implements OnInit {
  readonly userName = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private auth = inject(AuthService);
  private router = inject(Router);

  async submit() {
    this.error.set(null);
    try {
      const res = await this.auth.login({ username: this.userName(), password: this.password() }).toPromise();
      if (res) {
        // Centralize auth state via AuthService signals
        this.auth.setAuth(res.token, this.userName(), res.role ?? null);
        this.router.navigateByUrl('/');
      }
    } catch (e) {
      this.error.set('Login failed. Please check your credentials.');
    }
  }

  ngOnInit() {
    try {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get('u');
      if (prefill) {
        this.userName.set(prefill);
      }
    } catch {}
  }
}
