import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthLoginResponse {
  accountId?: number;
  shopId?: string;
  tenantId?: number;
  username?: string;
  role?: string;
  accessToken?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
}

/** Lightweight session mirror of shop-management-ui auth storage. */
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokenKey = 'sf.accessToken';
  private readonly roleKey = 'sf.role';
  private readonly userKey = 'sf.username';
  private readonly shopKey = 'sf.shopId';

  constructor(private readonly http: HttpClient) {}

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

  getShopId(): string | null {
    return localStorage.getItem(this.shopKey);
  }

  setShopId(shopId: string | null): void {
    if (!shopId) {
      localStorage.removeItem(this.shopKey);
      return;
    }
    localStorage.setItem(this.shopKey, shopId.trim());
  }

  clear(): void {
    this.setAccessToken(null);
    this.setRole(null);
    this.setUsername(null);
    this.setShopId(null);
  }

  login(shopId: string, username: string, password: string): Observable<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>('/api/v1/auth/login', { shopId, username, password }).pipe(
      tap((res) => {
        if (res.mfaRequired) {
          return;
        }
        if (res.accessToken) {
          this.setAccessToken(res.accessToken);
        }
        if (res.role) {
          this.setRole(res.role);
        }
        if (res.username) {
          this.setUsername(res.username);
        }
        if (res.shopId) {
          this.setShopId(res.shopId);
        }
      })
    );
  }
}
