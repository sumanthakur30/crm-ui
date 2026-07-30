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
    return next.handle(
      req.clone({
        setHeaders: { 'X-Tenant-Id': tenantId },
      })
    );
  }
}
