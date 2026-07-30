import { Component, OnInit } from '@angular/core';
import { CrmApiService } from './core/crm-api.service';
import { TenantService } from './core/tenant.service';
import {
  ImportResult,
  Lead,
  Pipeline,
  Stage,
  TeamMember,
  TimelineItem,
  Workspace,
} from './models/crm.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'SugamFlow CRM';
  view: 'list' | 'kanban' = 'kanban';

  tenantDraft = '';
  workspaceName = 'Demo Workspace';
  templateCode = 'GENERIC';
  searchQ = '';

  workspace: Workspace | null = null;
  pipelines: Pipeline[] = [];
  stages: Stage[] = [];
  leads: Lead[] = [];
  totalLeads = 0;
  members: TeamMember[] = [];

  selectedLead: Lead | null = null;
  timeline: TimelineItem[] = [];
  noteDraft = '';
  assignMode: 'ROUND_ROBIN' | 'MANUAL' = 'ROUND_ROBIN';
  manualOwner = '';

  memberForm = { userId: '', displayName: '' };

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
    this.reloadAll();
  }

  get kanbanColumns(): { stage: Stage; leads: Lead[] }[] {
    return this.stages.map((stage) => ({
      stage,
      leads: this.leads.filter((l) => l.stageId === stage.id),
    }));
  }

  saveTenant(): void {
    this.tenant.setTenantId(this.tenantDraft);
    this.message = `Tenant set to ${this.tenant.tenantId}`;
    this.error = '';
    this.workspace = null;
    this.selectedLead = null;
    this.reloadAll();
  }

  refreshStatus(): void {
    this.api.status().subscribe({
      next: (s) => {
        this.message = `${s.service} phase ${s.phase}`;
        this.error = '';
      },
      error: (err) => this.setError(err, 'Status check failed — is crm-service on :8095?'),
    });
  }

  reloadAll(): void {
    this.loadLeads();
    this.loadMembers();
    this.loadCurrentWorkspace();
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
          this.message = `Workspace ready: ${ws.name}`;
          this.error = '';
          this.busy = false;
          this.loadPipelinesAndStages(ws.defaultPipelineId);
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
        this.loadPipelinesAndStages(ws.defaultPipelineId);
      },
      error: () => {
        /* no workspace yet */
      },
    });
  }

  loadPipelinesAndStages(defaultPipelineId?: number | null): void {
    this.api.listPipelines().subscribe({
      next: (pipes) => {
        this.pipelines = pipes || [];
        const pipelineId =
          defaultPipelineId ||
          this.pipelines.find((p) => p.isDefault)?.id ||
          this.pipelines[0]?.id;
        if (!pipelineId) {
          this.stages = [];
          return;
        }
        this.api.listStages(pipelineId).subscribe({
          next: (stages) => {
            this.stages = (stages || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
          },
          error: (err) => this.setError(err, 'Failed to load stages'),
        });
      },
      error: () => {
        this.pipelines = [];
        this.stages = [];
      },
    });
  }

  loadLeads(): void {
    this.api.listLeads(this.searchQ).subscribe({
      next: (page) => {
        this.leads = page.content || [];
        this.totalLeads = page.totalElements ?? this.leads.length;
        this.error = '';
        if (this.selectedLead) {
          const fresh = this.leads.find((l) => l.id === this.selectedLead!.id);
          if (fresh) {
            this.selectedLead = fresh;
          }
        }
      },
      error: (err) => this.setError(err, 'Failed to load leads'),
    });
  }

  loadMembers(): void {
    this.api.listMembers('DEFAULT').subscribe({
      next: (m) => (this.members = m || []),
      error: () => (this.members = []),
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
        next: (lead) => {
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
          this.openLead(lead);
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Create lead failed');
        },
      });
  }

  openLead(lead: Lead): void {
    this.selectedLead = lead;
    this.noteDraft = '';
    this.loadTimeline(lead.id);
  }

  closeLead(): void {
    this.selectedLead = null;
    this.timeline = [];
  }

  loadTimeline(leadId: number): void {
    this.api.timeline(leadId).subscribe({
      next: (items) => (this.timeline = items || []),
      error: () => (this.timeline = []),
    });
  }

  addNote(): void {
    if (!this.selectedLead || !this.noteDraft.trim()) {
      return;
    }
    this.busy = true;
    this.api.addNote(this.selectedLead.id, this.noteDraft.trim()).subscribe({
      next: () => {
        this.busy = false;
        this.noteDraft = '';
        this.message = 'Note added';
        this.loadTimeline(this.selectedLead!.id);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Failed to add note');
      },
    });
  }

  moveLead(lead: Lead, stageId: number): void {
    if (lead.stageId === stageId) {
      return;
    }
    this.busy = true;
    this.api.moveStage(lead.id, stageId).subscribe({
      next: (updated) => {
        this.busy = false;
        this.message = `Moved to stage ${stageId}`;
        this.loadLeads();
        if (this.selectedLead?.id === updated.id) {
          this.openLead(updated);
        }
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Move stage failed');
      },
    });
  }

  assignSelected(): void {
    if (!this.selectedLead) {
      return;
    }
    const body =
      this.assignMode === 'ROUND_ROBIN'
        ? { mode: 'ROUND_ROBIN', teamId: 'DEFAULT' }
        : { mode: 'MANUAL', ownerUserId: this.manualOwner, teamId: 'DEFAULT' };
    if (this.assignMode === 'MANUAL' && !this.manualOwner.trim()) {
      this.error = 'Enter owner user id for manual assign';
      return;
    }
    this.busy = true;
    this.api.assignLead(this.selectedLead.id, body).subscribe({
      next: (lead) => {
        this.busy = false;
        this.message = `Assigned to ${lead.ownerUserId}`;
        this.selectedLead = lead;
        this.loadLeads();
        this.loadTimeline(lead.id);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Assign failed — add team members for round-robin');
      },
    });
  }

  addMember(): void {
    if (!this.memberForm.userId.trim()) {
      this.error = 'userId required';
      return;
    }
    this.api
      .upsertMember({
        teamId: 'DEFAULT',
        userId: this.memberForm.userId.trim(),
        displayName: this.memberForm.displayName || undefined,
        active: true,
      })
      .subscribe({
        next: () => {
          this.memberForm = { userId: '', displayName: '' };
          this.message = 'Team member saved';
          this.loadMembers();
        },
        error: (err) => this.setError(err, 'Failed to save member'),
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
        this.message = `Import: ${result.created} created, ${result.skipped} skipped`;
        this.loadLeads();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Import failed');
      },
    });
  }

  stageName(stageId?: number | null): string {
    return this.stages.find((s) => s.id === stageId)?.name || String(stageId ?? '—');
  }

  private setError(err: unknown, fallback: string): void {
    const e = err as { error?: { message?: string; error?: string }; message?: string; status?: number };
    const detail = e?.error?.message || e?.error?.error || e?.message || fallback;
    this.error = typeof detail === 'string' ? detail : fallback;
    if (e?.status) {
      this.error = `${this.error} (HTTP ${e.status})`;
    }
  }
}
