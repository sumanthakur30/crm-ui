import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CrmModuleId, CrmNavService } from './crm-nav.service';

/** Thin route host — syncs URL :module → CrmNavService (AppComponent keeps the real UI). */
@Component({
  selector: 'app-crm-module-route',
  template: '',
})
export class CrmModuleRouteComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly nav: CrmNavService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const raw = params.get('module');
      if (CrmNavService.isModule(raw)) {
        this.nav.setModule(raw as CrmModuleId);
      } else {
        this.nav.setModule('leads');
      }
    });
  }
}
