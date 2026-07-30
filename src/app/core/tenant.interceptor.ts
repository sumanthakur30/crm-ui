import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {
  constructor(private readonly tenant: TenantService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const tenantId = this.tenant.tenantId;
    if (!tenantId || !req.url.includes('/api/')) {
      return next.handle(req);
    }
    const headers: Record<string, string> = { 'X-Tenant-Id': tenantId };
    const shopId = this.tenant.shopId;
    if (shopId) {
      headers['X-Shop-Id'] = shopId;
    }
    return next.handle(req.clone({ setHeaders: headers }));
  }
}
