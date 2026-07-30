import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthSessionService } from './auth-session.service';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  constructor(private readonly auth: AuthSessionService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.includes('/api/') || req.url.includes('/api/v1/crm/public/')) {
      return next.handle(req);
    }
    const token = this.auth.getAccessToken();
    if (!token) {
      return next.handle(req);
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    const role = this.auth.getRole();
    if (role) {
      headers['X-Auth-Role'] = role;
    }
    const user = this.auth.getUsername();
    if (user) {
      headers['X-Auth-User'] = user;
      headers['X-User-Id'] = user;
    }
    return next.handle(req.clone({ setHeaders: headers }));
  }
}
