import { Injectable } from '@angular/core';

/** Lightweight session mirror of shop-management-ui auth storage (no full login UI required). */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokenKey = 'sf.accessToken';
  private readonly roleKey = 'sf.role';
  private readonly userKey = 'sf.username';

  getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  setAccessToken(token: string | null): void {
    if (!token) {
      localStorage.removeItem(this.tokenKey);
      return;
    }
    localStorage.setItem(this.tokenKey, token.trim());
  }

  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  setRole(role: string | null): void {
    if (!role) {
      localStorage.removeItem(this.roleKey);
      return;
    }
    localStorage.setItem(this.roleKey, role.trim().toUpperCase());
  }

  getUsername(): string | null {
    return localStorage.getItem(this.userKey);
  }

  setUsername(username: string | null): void {
    if (!username) {
      localStorage.removeItem(this.userKey);
      return;
    }
    localStorage.setItem(this.userKey, username.trim());
  }

  clear(): void {
    this.setAccessToken(null);
    this.setRole(null);
    this.setUsername(null);
  }
}
