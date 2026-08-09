import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CrmModuleId =
  | 'leads'
  | 'deals'
  | 'quotes'
  | 'insights'
  | 'campaigns'
  | 'accounts'
  | 'ops'
  | 'cases'
  | 'enterprise';

export const CRM_MODULES: CrmModuleId[] = [
  'leads',
  'deals',
  'quotes',
  'insights',
  'accounts',
  'campaigns',
  'ops',
  'cases',
  'enterprise',
];

@Injectable({ providedIn: 'root' })
export class CrmNavService {
  private readonly moduleSubject = new BehaviorSubject<CrmModuleId>('leads');
  readonly module$ = this.moduleSubject.asObservable();

  get module(): CrmModuleId {
    return this.moduleSubject.value;
  }

  setModule(m: CrmModuleId): void {
    if (this.moduleSubject.value !== m) {
      this.moduleSubject.next(m);
    }
  }

  static isModule(raw: string | null | undefined): raw is CrmModuleId {
    return !!raw && (CRM_MODULES as string[]).includes(raw);
  }
}
