import { Component, OnInit } from '@angular/core';
import { CrmApiService } from './core/crm-api.service';
import { TenantService } from './core/tenant.service';
import {
  ImportResult,
  Lead,
  Opportunity,
  Pipeline,
  Quotation,
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
  module: 'leads' | 'deals' | 'quotes' = 'leads';
  view: 'list' | 'kanban' = 'kanban';

  tenantDraft = '';
  workspaceName = 'Demo Workspace';
  templateCode = 'GENERIC';
  templates: string[] = ['GENERIC', 'EDUCATION', 'RETAIL', 'MEDICAL_DISTRIBUTOR'];
  searchQ = '';

  workspace: Workspace | null = null;
  pipelines: Pipeline[] = [];
  stages: Stage[] = [];
  dealStages: Stage[] = [];
  leads: Lead[] = [];
  opportunities: Opportunity[] = [];
  quotations: Quotation[] = [];
  totalLeads = 0;
  totalOpps = 0;
  members: TeamMember[] = [];

  selectedLead: Lead | null = null;
  selectedOpp: Opportunity | null = null;
  selectedQuote: Quotation | null = null;
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

  oppForm = {
    name: '',
    amount: null as number | null,
    currency: 'INR',
    leadId: null as number | null,
  };

  quoteForm = {
    opportunityId: null as number | null,
    customerName: '',
    customerGstin: '',
    placeOfSupply: 'KA',
    sellerStateCode: '29',
    buyerStateCode: '29',
    terms: 'Payment due within 15 days.',
    lineDescription: 'Professional services',
    hsn: '9983',
    qty: 1,
    unitPrice: 10000,
    gstRate: 18,
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
    this.loadTemplates();
    this.reloadAll();
  }

  get kanbanColumns(): { stage: Stage; leads: Lead[] }[] {
    return this.stages.map((stage) => ({
      stage,
      leads: this.leads.filter((l) => l.stageId === stage.id),
    }));
  }

  get dealKanbanColumns(): { stage: Stage; opps: Opportunity[] }[] {
    return this.dealStages.map((stage) => ({
      stage,
      opps: this.opportunities.filter((o) => o.stageId === stage.id),
    }));
  }

  setModule(m: 'leads' | 'deals' | 'quotes'): void {
    this.module = m;
    this.selectedLead = null;
    this.selectedOpp = null;
    this.selectedQuote = null;
    if (m === 'deals') {
      this.loadOpportunities();
    } else if (m === 'quotes') {
      this.loadOpportunities();
    }
  }

  saveTenant(): void {
    this.tenant.setTenantId(this.tenantDraft);
    this.message = `Tenant set to ${this.tenant.tenantId}`;
    this.error = '';
    this.workspace = null;
    this.selectedLead = null;
    this.selectedOpp = null;
    this.selectedQuote = null;
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

  loadTemplates(): void {
    this.api.listTemplates().subscribe({
      next: (codes) => {
        if (codes?.length) {
          this.templates = codes;
        }
      },
      error: () => {
        /* keep defaults */
      },
    });
  }

  reloadAll(): void {
    this.loadLeads();
    this.loadMembers();
    this.loadCurrentWorkspace();
    this.loadOpportunities();
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
          this.message = `Workspace ready: ${ws.name} (${ws.templateCode || this.templateCode})`;
          this.error = '';
          this.busy = false;
          this.loadPipelinesAndStages(ws.defaultPipelineId);
          this.loadLeads();
          this.loadOpportunities();
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
        this.templateCode = ws.templateCode || this.templateCode;
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
        const leadPipe =
          this.pipelines.find((p) => (p.objectType || '').toUpperCase() === 'LEAD' && p.isDefault) ||
          this.pipelines.find((p) => (p.objectType || '').toUpperCase() === 'LEAD') ||
          this.pipelines.find((p) => p.id === defaultPipelineId) ||
          this.pipelines[0];
        const dealPipe =
          this.pipelines.find((p) => (p.objectType || '').toUpperCase() === 'OPPORTUNITY' && p.isDefault) ||
          this.pipelines.find((p) => (p.objectType || '').toUpperCase() === 'OPPORTUNITY');

        if (leadPipe?.id) {
          this.api.listStages(leadPipe.id).subscribe({
            next: (stages) => {
              this.stages = (stages || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
            },
            error: (err) => this.setError(err, 'Failed to load lead stages'),
          });
        } else {
          this.stages = [];
        }

        if (dealPipe?.id) {
          this.api.listStages(dealPipe.id).subscribe({
            next: (stages) => {
              this.dealStages = (stages || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
            },
            error: (err) => this.setError(err, 'Failed to load deal stages'),
          });
        } else {
          this.dealStages = [];
        }
      },
      error: () => {
        this.pipelines = [];
        this.stages = [];
        this.dealStages = [];
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

  loadOpportunities(): void {
    this.api.listOpportunities(this.searchQ).subscribe({
      next: (page) => {
        this.opportunities = page.content || [];
        this.totalOpps = page.totalElements ?? this.opportunities.length;
        if (this.selectedOpp) {
          const fresh = this.opportunities.find((o) => o.id === this.selectedOpp!.id);
          if (fresh) {
            this.selectedOpp = fresh;
            this.loadQuotesForOpp(fresh.id);
          }
        }
      },
      error: (err) => this.setError(err, 'Failed to load opportunities'),
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

  createOpportunity(fromLead?: Lead): void {
    const name =
      fromLead?.title?.trim() ||
      this.oppForm.name.trim() ||
      (fromLead ? `Deal: ${fromLead.title}` : '');
    if (!name) {
      this.error = 'Opportunity name is required';
      return;
    }
    this.busy = true;
    this.api
      .createOpportunity({
        name,
        leadId: fromLead?.id ?? this.oppForm.leadId,
        amount: this.oppForm.amount,
        currency: this.oppForm.currency || 'INR',
      })
      .subscribe({
        next: (opp) => {
          this.busy = false;
          this.message = `Opportunity #${opp.id} created`;
          this.error = '';
          this.oppForm = { name: '', amount: null, currency: 'INR', leadId: null };
          this.loadOpportunities();
          this.setModule('deals');
          this.openOpp(opp);
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Create opportunity failed');
        },
      });
  }

  createQuotation(): void {
    const oppId = this.quoteForm.opportunityId || this.selectedOpp?.id;
    if (!oppId) {
      this.error = 'Select an opportunity for the quotation';
      return;
    }
    if (!this.quoteForm.lineDescription.trim()) {
      this.error = 'Line description is required';
      return;
    }
    this.busy = true;
    this.api
      .createQuotation({
        opportunityId: oppId,
        customerName: this.quoteForm.customerName || null,
        customerGstin: this.quoteForm.customerGstin || null,
        placeOfSupply: this.quoteForm.placeOfSupply || null,
        sellerStateCode: this.quoteForm.sellerStateCode || null,
        buyerStateCode: this.quoteForm.buyerStateCode || null,
        currency: 'INR',
        terms: this.quoteForm.terms || null,
        lines: [
          {
            description: this.quoteForm.lineDescription.trim(),
            hsn: this.quoteForm.hsn || null,
            qty: Number(this.quoteForm.qty) || 1,
            unitPrice: Number(this.quoteForm.unitPrice) || 0,
            gstRate: Number(this.quoteForm.gstRate) || 0,
          },
        ],
      })
      .subscribe({
        next: (q) => {
          this.busy = false;
          this.message = `Quote ${q.quoteNumber} · total ₹${q.totalAmount}`;
          this.error = '';
          this.selectedQuote = q;
          this.setModule('quotes');
          if (this.selectedOpp) {
            this.loadQuotesForOpp(this.selectedOpp.id);
          } else {
            this.quotations = [q];
          }
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Create quotation failed');
        },
      });
  }

  openLead(lead: Lead): void {
    this.selectedLead = lead;
    this.selectedOpp = null;
    this.selectedQuote = null;
    this.noteDraft = '';
    this.loadTimeline(lead.id);
  }

  closeLead(): void {
    this.selectedLead = null;
    this.timeline = [];
  }

  openOpp(opp: Opportunity): void {
    this.selectedOpp = opp;
    this.selectedLead = null;
    this.selectedQuote = null;
    this.quoteForm.opportunityId = opp.id;
    this.loadQuotesForOpp(opp.id);
  }

  closeOpp(): void {
    this.selectedOpp = null;
    this.quotations = [];
  }

  loadQuotesForOpp(opportunityId: number): void {
    this.api.listQuotationsForOpportunity(opportunityId).subscribe({
      next: (list) => (this.quotations = list || []),
      error: () => (this.quotations = []),
    });
  }

  openQuote(q: Quotation): void {
    this.selectedQuote = q;
  }

  sendQuote(q: Quotation): void {
    this.busy = true;
    this.api.sendQuotation(q.id).subscribe({
      next: (updated) => {
        this.busy = false;
        this.selectedQuote = updated;
        this.message = `Quote ${updated.quoteNumber} marked SENT`;
        this.loadQuotesForOpp(updated.opportunityId);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Send failed');
      },
    });
  }

  acceptQuote(q: Quotation): void {
    this.busy = true;
    this.api.acceptQuotation(q.id).subscribe({
      next: (updated) => {
        this.busy = false;
        this.selectedQuote = updated;
        this.message = `Quote ${updated.quoteNumber} accepted`;
        this.loadQuotesForOpp(updated.opportunityId);
        this.loadOpportunities();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Accept failed');
      },
    });
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

  moveOpp(opp: Opportunity, stageId: number): void {
    if (opp.stageId === stageId) {
      return;
    }
    this.busy = true;
    this.api.moveOpportunityStage(opp.id, stageId).subscribe({
      next: (updated) => {
        this.busy = false;
        this.message = `Deal moved · ${updated.status}`;
        this.loadOpportunities();
        if (this.selectedOpp?.id === updated.id) {
          this.openOpp(updated);
        }
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Move deal stage failed');
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
    return (
      this.stages.find((s) => s.id === stageId)?.name ||
      this.dealStages.find((s) => s.id === stageId)?.name ||
      String(stageId ?? '—')
    );
  }

  shareText(q: Quotation | null): string {
    const payload = q?.sharePayload;
    if (!payload) {
      return '';
    }
    return String(payload['whatsappText'] || payload['emailText'] || JSON.stringify(payload, null, 2));
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
