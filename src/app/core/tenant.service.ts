import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'crm.tenantId';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly tenantSubject = new BehaviorSubject<string>(
    localStorage.getItem(STORAGE_KEY) || 'demo-crm'
  );

  readonly tenantId$ = this.tenantSubject.asObservable();

  get tenantId(): string {
    return this.tenantSubject.value;
  }

  setTenantId(tenantId: string): void {
    const next = (tenantId || '').trim() || 'demo-crm';
    localStorage.setItem(STORAGE_KEY, next);
    this.tenantSubject.next(next);
  }
}
