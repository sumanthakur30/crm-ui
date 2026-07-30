import { Component, OnInit } from '@angular/core';
import { CrmApiService } from './core/crm-api.service';
import { TenantService } from './core/tenant.service';
import { ImportResult, Lead, Workspace } from './models/crm.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'SugamFlow CRM';

  tenantDraft = '';
  workspaceName = 'Demo Workspace';
  templateCode = 'GENERIC';
  searchQ = '';

  workspace: Workspace | null = null;
  leads: Lead[] = [];
  totalLeads = 0;

  leadForm = {
    title: '',
    displayName: '',
    companyName: '',
    email: '',
    phone: '',
    sourceCode: 'WEBSITE',
  };

  importFile: File | null = null;
  importResult: ImportResult | null = null;
  assignRoundRobin = false;

  busy = false;
  message = '';
  error = '';

  constructor(
    private readonly api: CrmApiService,
    readonly tenant: TenantService
  ) {
    this.tenantDraft = tenant.tenantId;
  }

  ngOnInit(): void {
    this.refreshStatus();
    this.loadLeads();
  }

  saveTenant(): void {
    this.tenant.setTenantId(this.tenantDraft);
    this.message = `Tenant set to ${this.tenant.tenantId}`;
    this.error = '';
    this.workspace = null;
    this.loadLeads();
  }

  refreshStatus(): void {
    this.api.status().subscribe({
      next: (s) => {
        this.message = `${s.service} phase ${s.phase} (entitlement check: ${s.entitlementCheckEnabled})`;
        this.error = '';
      },
      error: (err) => this.setError(err, 'Status check failed'),
    });
  }

  bootstrapWorkspace(): void {
    this.busy = true;
    this.api
      .bootstrap({
        name: this.workspaceName || 'Demo Workspace',
        templateCode: this.templateCode || 'GENERIC',
      })
      .subscribe({
        next: (ws) => {
          this.workspace = ws;
          this.message = `Workspace ready: ${ws.name} (id ${ws.id})`;
          this.error = '';
          this.busy = false;
          this.loadLeads();
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Bootstrap failed');
        },
      });
  }

  loadCurrentWorkspace(): void {
    this.api.currentWorkspace().subscribe({
      next: (ws) => {
        this.workspace = ws;
        this.message = `Current workspace: ${ws.name}`;
        this.error = '';
      },
      error: (err) => this.setError(err, 'No workspace for tenant'),
    });
  }

  loadLeads(): void {
    this.api.listLeads(this.searchQ).subscribe({
      next: (page) => {
        this.leads = page.content || [];
        this.totalLeads = page.totalElements ?? this.leads.length;
        this.error = '';
      },
      error: (err) => this.setError(err, 'Failed to load leads'),
    });
  }

  createLead(): void {
    if (!this.leadForm.title.trim()) {
      this.error = 'Title is required';
      return;
    }
    this.busy = true;
    this.api
      .createLead({
        title: this.leadForm.title.trim(),
        displayName: this.leadForm.displayName || null,
        companyName: this.leadForm.companyName || null,
        email: this.leadForm.email || null,
        phone: this.leadForm.phone || null,
        sourceCode: this.leadForm.sourceCode || null,
      })
      .subscribe({
        next: () => {
          this.busy = false;
          this.message = 'Lead created';
          this.error = '';
          this.leadForm = {
            title: '',
            displayName: '',
            companyName: '',
            email: '',
            phone: '',
            sourceCode: 'WEBSITE',
          };
          this.loadLeads();
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Create lead failed');
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.importFile = input.files && input.files.length ? input.files[0] : null;
    this.importResult = null;
  }

  uploadImport(): void {
    if (!this.importFile) {
      this.error = 'Choose a CSV (or XLSX) file first';
      return;
    }
    this.busy = true;
    this.api.importLeads(this.importFile, this.assignRoundRobin).subscribe({
      next: (result) => {
        this.busy = false;
        this.importResult = result;
        this.message = `Import done: ${result.created} created, ${result.skipped} skipped of ${result.totalRows}`;
        this.error = '';
        this.loadLeads();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Import failed');
      },
    });
  }

  private setError(err: unknown, fallback: string): void {
    const e = err as { error?: { message?: string; error?: string }; message?: string; status?: number };
    const detail =
      e?.error?.message || e?.error?.error || e?.message || fallback;
    this.error = typeof detail === 'string' ? detail : fallback;
    if (e?.status) {
      this.error = `${this.error} (HTTP ${e.status})`;
    }
  }
}
