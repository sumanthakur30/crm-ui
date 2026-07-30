import { Component, OnInit } from '@angular/core';
import { CrmApiService } from './core/crm-api.service';
import { TenantService } from './core/tenant.service';
import { AuthSessionService } from './core/auth-session.service';
import {
  Campaign,
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
  module: 'leads' | 'deals' | 'quotes' | 'insights' | 'campaigns' | 'ops' | 'enterprise' = 'leads';
  view: 'list' | 'kanban' = 'kanban';

  tenantDraft = '';
  workspaceName = 'Demo Workspace';
  templateCode = 'RETAIL';
  templates: string[] = ['GENERIC', 'EDUCATION', 'RETAIL', 'MEDICAL_DISTRIBUTOR'];
  searchQ = '';
  authTokenDraft = '';
  authUserDraft = '';
  loginShopId = '';
  loginUsername = '';
  loginPassword = '';
  showLogin = false;

  workspace: Workspace | null = null;
  pipelines: Pipeline[] = [];
  stages: Stage[] = [];
  dealStages: Stage[] = [];
  leads: Lead[] = [];
  opportunities: Opportunity[] = [];
  quotations: Quotation[] = [];
  campaigns: Campaign[] = [];
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
    campaignId: null as number | null,
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
  };

  campaignForm = {
    code: '',
    name: '',
    channel: 'PAID_SEARCH',
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: '',
    landingUrl: '',
  };

  captureDemo = {
    publicKey: '',
    title: 'Landing page lead',
    phone: '',
    email: '',
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

  sendForm = {
    channel: 'WHATSAPP' as 'WHATSAPP' | 'EMAIL' | 'SMS' | '',
    recipient: '',
  };

  sequenceId: number | null = null;
  enrollRecipient = '';
  convertTarget: 'SHOP_CUSTOMER' | 'SCHOOL_INQUIRY' | 'FIELD_FORCE' = 'SHOP_CUSTOMER';
  analytics: Record<string, unknown> | null = null;
  openTasks: Array<Record<string, unknown>> = [];
  forecast: Record<string, unknown> | null = null;
  approvals: Array<Record<string, unknown>> = [];
  fieldAcl: Array<Record<string, unknown>> = [];
  adapterEvents: Array<Record<string, unknown>> = [];
  scoreRules: Array<Record<string, unknown>> = [];
  callForm = { phone: '', outcome: 'CONNECTED', durationSec: 60 };
  meetingTitle = 'Discovery call';
  adapterProvider: 'META' | 'GOOGLE' | 'MISSED_CALL' | 'CHATBOT' = 'META';
  adapterPhone = '';
  adapterName = '';
  reportCode = 'DAILY_FUNNEL';

  enterpriseSettings: Record<string, unknown> | null = null;
  enterpriseForm = {
    dataResidency: 'IN',
    preferredLanguage: 'en',
    aiEnabled: true,
    auditExportEnabled: true,
    ssoEnabled: false,
    ssoProvider: '',
    ssoMetadataUrl: '',
  };
  ssoNote = '';
  auditExports: Array<Record<string, unknown>> = [];
  aiInsights: Array<Record<string, unknown>> = [];
  lastInsight: Record<string, unknown> | null = null;
  copilotQuestion = '';
  aiLanguage = 'en';

  importFile: File | null = null;
  importResult: ImportResult | null = null;
  assignRoundRobin = false;

  busy = false;
  message = '';
  error = '';

  constructor(
    private readonly api: CrmApiService,
    readonly tenant: TenantService,
    readonly auth: AuthSessionService
  ) {
    this.tenantDraft = tenant.tenantId;
    this.authTokenDraft = auth.getAccessToken() || '';
    this.authUserDraft = auth.getUsername() || '';
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

  setModule(m: 'leads' | 'deals' | 'quotes' | 'insights' | 'campaigns' | 'ops' | 'enterprise'): void {
    this.module = m;
    if (m !== 'enterprise') {
      this.selectedLead = null;
      this.selectedOpp = null;
      this.selectedQuote = null;
    }
    if (m === 'deals') {
      this.loadOpportunities();
    } else if (m === 'quotes') {
      this.loadOpportunities();
    } else if (m === 'insights') {
      this.loadInsights();
    } else if (m === 'campaigns') {
      this.loadCampaigns();
    } else if (m === 'ops') {
      this.loadOps();
    } else if (m === 'enterprise') {
      this.loadEnterprise();
      if (this.selectedLead) {
        this.loadLeadInsights();
      }
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

  saveAuth(): void {
    this.auth.setAccessToken(this.authTokenDraft?.trim() || null);
    this.auth.setUsername(this.authUserDraft?.trim() || null);
    this.message = this.auth.getAccessToken()
      ? 'Bearer token saved for CRM API calls'
      : 'Auth token cleared — tenant header only';
    this.error = '';
  }

  login(): void {
    if (!this.loginShopId.trim() || !this.loginUsername.trim() || !this.loginPassword) {
      this.error = 'shopId, username, and password required';
      return;
    }
    this.busy = true;
    this.auth.login(this.loginShopId.trim(), this.loginUsername.trim(), this.loginPassword).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.mfaRequired) {
          this.error = 'MFA required — complete MFA in shop UI, then paste token here';
          return;
        }
        this.authTokenDraft = res.accessToken || '';
        this.authUserDraft = res.username || this.loginUsername;
        if (res.shopId && !this.tenantDraft) {
          this.tenantDraft = res.shopId;
          this.saveTenant();
        } else if (res.shopId) {
          this.tenantDraft = String(res.shopId);
          this.saveTenant();
        }
        this.loginPassword = '';
        this.showLogin = false;
        this.message = `Logged in as ${res.username} (${res.role})`;
        this.error = '';
        this.refreshStatus();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Login failed — is auth-service up?');
      },
    });
  }

  logout(): void {
    this.auth.clear();
    this.authTokenDraft = '';
    this.authUserDraft = '';
    this.message = 'Logged out';
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
    this.loadCampaigns();
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
        campaignId: this.leadForm.campaignId,
        utmSource: this.leadForm.utmSource || null,
        utmMedium: this.leadForm.utmMedium || null,
        utmCampaign: this.leadForm.utmCampaign || null,
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
            campaignId: null,
            utmSource: '',
            utmMedium: '',
            utmCampaign: '',
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
    this.loadLeadInsights();
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
    const channel = this.sendForm.channel?.trim();
    const recipient = this.sendForm.recipient?.trim();
    if (channel && !recipient) {
      this.error = 'Recipient required when a channel is selected';
      return;
    }
    this.busy = true;
    const payload = channel && recipient ? { channel, recipient } : {};
    this.api.sendQuotation(q.id, payload).subscribe({
      next: (updated) => {
        this.busy = false;
        this.selectedQuote = updated;
        const delivery = updated.sharePayload?.['lastDelivery'] as { status?: string } | undefined;
        this.message =
          `Quote ${updated.quoteNumber} SENT` +
          (delivery?.status ? ` · delivery ${delivery.status}` : '');
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

  createPaymentLink(q: Quotation): void {
    this.busy = true;
    this.api.createPaymentLink(q.id).subscribe({
      next: (updated) => {
        this.busy = false;
        this.selectedQuote = updated;
        this.message = `Payment link: ${updated.paymentLinkUrl}`;
        this.loadQuotesForOpp(updated.opportunityId);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Payment link failed');
      },
    });
  }

  markPaid(q: Quotation): void {
    this.busy = true;
    this.api.markQuotePaid(q.id).subscribe({
      next: (updated) => {
        this.busy = false;
        this.selectedQuote = updated;
        this.message = `Quote ${updated.quoteNumber} marked PAID`;
        this.loadQuotesForOpp(updated.opportunityId);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Mark paid failed');
      },
    });
  }

  openPdf(q: Quotation): void {
    this.api.downloadQuotationPdf(q.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${q.quoteNumber || 'quotation'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.setError(err, 'PDF download failed'),
    });
  }

  loadInsights(): void {
    this.api.analyticsSummary().subscribe({
      next: (s) => (this.analytics = s),
      error: (err) => this.setError(err, 'Analytics failed'),
    });
    this.api.listOpenTasks().subscribe({
      next: (t) => (this.openTasks = t || []),
      error: () => (this.openTasks = []),
    });
  }

  processSla(): void {
    this.api.processSlaAging().subscribe({
      next: (r) => {
        this.message = `SLA: created ${r.tasksCreated}, overdue open ${r.openOverdueTasks}`;
        this.loadInsights();
      },
      error: (err) => this.setError(err, 'SLA process failed'),
    });
  }

  convertSelectedLead(): void {
    if (!this.selectedLead) {
      return;
    }
    this.busy = true;
    this.api.convertLead(this.selectedLead.id, this.convertTarget).subscribe({
      next: (res) => {
        this.busy = false;
        this.message = `Convert ${this.convertTarget}: ${res['status']}`;
        this.loadTimeline(this.selectedLead!.id);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Convert failed');
      },
    });
  }

  funnelRows(key: string): Array<Record<string, unknown>> {
    const rows = this.analytics?.[key];
    return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
  }

  loadCampaigns(): void {
    this.api.listCampaigns().subscribe({
      next: (list) => {
        this.campaigns = list || [];
        if (!this.captureDemo.publicKey && this.campaigns.length) {
          this.captureDemo.publicKey = this.campaigns[0].publicKey;
        }
      },
      error: (err) => this.setError(err, 'Failed to load campaigns'),
    });
  }

  createCampaign(): void {
    if (!this.campaignForm.code.trim() || !this.campaignForm.name.trim()) {
      this.error = 'Campaign code and name required';
      return;
    }
    this.busy = true;
    this.api
      .upsertCampaign({
        code: this.campaignForm.code.trim(),
        name: this.campaignForm.name.trim(),
        status: 'ACTIVE',
        channel: this.campaignForm.channel || null,
        utmSource: this.campaignForm.utmSource || null,
        utmMedium: this.campaignForm.utmMedium || null,
        utmCampaign: this.campaignForm.utmCampaign || this.campaignForm.code.trim().toLowerCase(),
        landingUrl: this.campaignForm.landingUrl || null,
      })
      .subscribe({
        next: (c) => {
          this.busy = false;
          this.message = `Campaign ${c.code} · capture ${c.capturePath}`;
          this.captureDemo.publicKey = c.publicKey;
          this.campaignForm = {
            code: '',
            name: '',
            channel: 'PAID_SEARCH',
            utmSource: 'google',
            utmMedium: 'cpc',
            utmCampaign: '',
            landingUrl: '',
          };
          this.loadCampaigns();
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Create campaign failed');
        },
      });
  }

  runPublicCapture(): void {
    if (!this.captureDemo.publicKey.trim()) {
      this.error = 'Pick a campaign public key';
      return;
    }
    this.busy = true;
    this.api
      .publicCapture(this.captureDemo.publicKey.trim(), {
        title: this.captureDemo.title || 'Landing page lead',
        phone: this.captureDemo.phone || null,
        email: this.captureDemo.email || null,
      })
      .subscribe({
        next: (lead) => {
          this.busy = false;
          this.message = `Public capture → lead #${lead.id} · utm ${lead.utmSource || '—'}`;
          this.loadLeads();
          this.setModule('leads');
          this.openLead(lead);
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Public capture failed');
        },
      });
  }

  campaignName(id?: number | null): string {
    if (!id) {
      return '—';
    }
    return this.campaigns.find((c) => c.id === id)?.name || String(id);
  }

  loadOps(): void {
    this.api.forecast().subscribe({
      next: (f) => (this.forecast = f),
      error: (err) => this.setError(err, 'Forecast failed'),
    });
    this.api.listApprovals().subscribe({
      next: (a) => (this.approvals = a || []),
      error: () => (this.approvals = []),
    });
    this.api.listFieldAcl().subscribe({
      next: (a) => (this.fieldAcl = a || []),
      error: () => (this.fieldAcl = []),
    });
    this.api.adapterEvents().subscribe({
      next: (e) => (this.adapterEvents = e || []),
      error: () => (this.adapterEvents = []),
    });
    this.api.ensureScoreRules().subscribe({
      next: (r) => (this.scoreRules = r || []),
      error: () => (this.scoreRules = []),
    });
  }

  rescoreSelected(): void {
    if (!this.selectedLead) {
      return;
    }
    this.api.rescoreLead(this.selectedLead.id).subscribe({
      next: (lead) => {
        this.selectedLead = lead;
        this.message = `Lead score ${lead.score}`;
        this.loadLeads();
      },
      error: (err) => this.setError(err, 'Rescore failed'),
    });
  }

  logCallSelected(): void {
    if (!this.selectedLead) {
      return;
    }
    this.api
      .logCall({
        leadId: this.selectedLead.id,
        phone: this.callForm.phone || this.selectedLead.phone,
        outcome: this.callForm.outcome,
        durationSec: this.callForm.durationSec,
        direction: 'OUTBOUND',
      })
      .subscribe({
        next: () => {
          this.message = 'Call logged (+score if connected)';
          this.loadTimeline(this.selectedLead!.id);
          this.loadLeads();
        },
        error: (err) => this.setError(err, 'Call log failed'),
      });
  }

  bookMeetingSelected(): void {
    if (!this.selectedLead) {
      return;
    }
    const starts = new Date(Date.now() + 3600_000).toISOString();
    this.api
      .createCalendar({
        relatedType: 'LEAD',
        relatedId: this.selectedLead.id,
        title: this.meetingTitle || 'Meeting',
        startsAt: starts,
      })
      .subscribe({
        next: () => {
          this.message = 'Meeting booked (+score)';
          this.loadTimeline(this.selectedLead!.id);
          this.loadLeads();
        },
        error: (err) => this.setError(err, 'Calendar failed'),
      });
  }

  requestOppApproval(): void {
    if (!this.selectedOpp) {
      return;
    }
    this.api
      .requestApproval({
        objectType: 'OPPORTUNITY',
        objectId: this.selectedOpp.id,
        title: `Approve deal ${this.selectedOpp.name}`,
      })
      .subscribe({
        next: () => {
          this.message = 'Approval requested';
          this.loadOps();
        },
        error: (err) => this.setError(err, 'Approval failed'),
      });
  }

  decide(id: number, approve: boolean): void {
    this.api.decideApproval(id, approve).subscribe({
      next: () => {
        this.message = approve ? 'Approved' : 'Rejected';
        this.loadOps();
      },
      error: (err) => this.setError(err, 'Decide failed'),
    });
  }

  ensureAcl(): void {
    this.api.ensureFieldAcl().subscribe({
      next: (rows) => {
        this.fieldAcl = rows || [];
        this.message = 'Default field ACL seeded';
      },
      error: (err) => this.setError(err, 'ACL failed'),
    });
  }

  scheduleReport(): void {
    this.api
      .upsertReportSchedule({
        code: this.reportCode || 'DAILY_FUNNEL',
        name: 'Daily funnel digest',
        reportType: 'FUNNEL',
        frequency: 'DAILY',
        recipients: ['ops@example.com'],
        active: true,
      })
      .subscribe({
        next: () => {
          this.message = 'Report schedule saved';
        },
        error: (err) => this.setError(err, 'Schedule failed'),
      });
  }

  runReports(): void {
    this.api.runReports().subscribe({
      next: (r) => {
        this.message = `Reports ran: ${r['ran']}`;
      },
      error: (err) => this.setError(err, 'Run reports failed'),
    });
  }

  runAdapter(): void {
    const body: Record<string, unknown> = {
      name: this.adapterName || 'Adapter lead',
      phone: this.adapterPhone || '9876500000',
      externalId: `${this.adapterProvider}-${Date.now()}`,
    };
    if (this.captureDemo.publicKey && (this.adapterProvider === 'META' || this.adapterProvider === 'GOOGLE')) {
      body['publicKey'] = this.captureDemo.publicKey;
    }
    this.api.adapterIngest(this.adapterProvider, body).subscribe({
      next: (res) => {
        this.message = `${this.adapterProvider} → ${res['status']} lead ${res['leadId']}`;
        this.loadLeads();
        this.loadOps();
      },
      error: (err) => this.setError(err, 'Adapter ingest failed'),
    });
  }

  findDuplicates(): void {
    if (!this.selectedLead) {
      return;
    }
    this.api.findDuplicates(this.selectedLead.id).subscribe({
      next: (rows) => {
        if (!rows?.length) {
          this.message = 'No duplicates by phone/email';
          return;
        }
        const first = rows[0];
        const dupId = Number(first['id']);
        if (!dupId || !confirm(`Merge duplicate #${dupId} into #${this.selectedLead!.id}?`)) {
          this.message = `Found ${rows.length} duplicate(s)`;
          return;
        }
        this.api.mergeLeads(this.selectedLead!.id, dupId).subscribe({
          next: () => {
            this.message = `Merged #${dupId} into #${this.selectedLead!.id}`;
            this.loadLeads();
            this.loadTimeline(this.selectedLead!.id);
          },
          error: (err) => this.setError(err, 'Merge failed'),
        });
      },
      error: (err) => this.setError(err, 'Duplicate search failed'),
    });
  }

  loadEnterprise(): void {
    this.api.enterpriseSettings().subscribe({
      next: (s) => {
        this.enterpriseSettings = s;
        this.enterpriseForm = {
          dataResidency: String(s['dataResidency'] || 'IN'),
          preferredLanguage: String(s['preferredLanguage'] || 'en'),
          aiEnabled: !!s['aiEnabled'],
          auditExportEnabled: !!s['auditExportEnabled'],
          ssoEnabled: !!s['ssoEnabled'],
          ssoProvider: String(s['ssoProvider'] || ''),
          ssoMetadataUrl: String(s['ssoMetadataUrl'] || ''),
        };
        this.aiLanguage = this.enterpriseForm.preferredLanguage;
      },
      error: (err) => this.setError(err, 'Enterprise settings failed'),
    });
    this.api.ssoStatus().subscribe({
      next: (s) => (this.ssoNote = String(s['note'] || '')),
      error: () => (this.ssoNote = ''),
    });
    this.api.listAuditExports().subscribe({
      next: (rows) => (this.auditExports = rows || []),
      error: () => (this.auditExports = []),
    });
  }

  saveEnterprise(): void {
    this.busy = true;
    this.api.updateEnterpriseSettings({ ...this.enterpriseForm }).subscribe({
      next: (s) => {
        this.busy = false;
        this.enterpriseSettings = s;
        this.message = `Enterprise saved · residency ${s['dataResidency']}`;
        this.aiLanguage = String(s['preferredLanguage'] || 'en');
        this.loadEnterprise();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Save enterprise failed');
      },
    });
  }

  runAuditExport(): void {
    this.busy = true;
    this.api.requestAuditExport({ format: 'JSON' }).subscribe({
      next: (job) => {
        this.busy = false;
        this.message = `Audit export #${job['id']} ${job['status']} (${job['rowCount']} rows)`;
        this.loadEnterprise();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Audit export failed');
      },
    });
  }

  runAi(kind: 'summarize' | 'nba' | 'score' | 'churn' | 'draft'): void {
    if (!this.selectedLead) {
      this.error = 'Select a lead first';
      return;
    }
    const id = this.selectedLead.id;
    const lang = this.aiLanguage || this.enterpriseForm.preferredLanguage;
    const obs =
      kind === 'summarize'
        ? this.api.summarizeLead(id, lang)
        : kind === 'nba'
          ? this.api.nextBestAction(id, lang)
          : kind === 'score'
            ? this.api.explainScore(id, lang)
            : kind === 'churn'
              ? this.api.churnUpsell(id, lang)
              : this.api.draftMessage(id, 'WHATSAPP', lang);
    obs.subscribe({
      next: (ins) => {
        this.lastInsight = ins;
        this.message = String(ins['title'] || 'AI done');
        this.loadLeadInsights();
        this.loadTimeline(id);
      },
      error: (err) => this.setError(err, 'AI action failed'),
    });
  }

  runWinPredict(): void {
    if (!this.selectedOpp) {
      this.error = 'Select a deal first';
      return;
    }
    this.api.winPredict(this.selectedOpp.id, this.aiLanguage || this.enterpriseForm.preferredLanguage).subscribe({
      next: (ins) => {
        this.lastInsight = ins;
        this.message = String(ins['title'] || 'Win predict');
      },
      error: (err) => this.setError(err, 'Win predict failed'),
    });
  }

  runOcrDemo(): void {
    this.api
      .ocrCard(
        {
          text: 'Name: Priya Shah\nPhone: 9876543210\nEmail: priya@example.com\nCompany: Acme Retail',
          leadId: this.selectedLead?.id || 0,
        },
        this.aiLanguage
      )
      .subscribe({
        next: (ins) => {
          this.lastInsight = ins;
          this.message = 'OCR card parsed';
        },
        error: (err) => this.setError(err, 'OCR failed'),
      });
  }

  runCopilot(): void {
    if (!this.copilotQuestion.trim()) {
      this.error = 'Enter a copilot question';
      return;
    }
    this.api
      .copilot({
        question: this.copilotQuestion.trim(),
        leadId: this.selectedLead?.id ?? null,
        opportunityId: this.selectedOpp?.id ?? null,
        language: this.aiLanguage || this.enterpriseForm.preferredLanguage,
      })
      .subscribe({
        next: (ins) => {
          this.lastInsight = ins;
          this.message = 'Copilot replied';
        },
        error: (err) => this.setError(err, 'Copilot failed'),
      });
  }

  loadLeadInsights(): void {
    if (!this.selectedLead) {
      this.aiInsights = [];
      return;
    }
    this.api.listAiInsights('LEAD', this.selectedLead.id).subscribe({
      next: (rows) => (this.aiInsights = rows || []),
      error: () => (this.aiInsights = []),
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

  ensureSequence(): void {
    this.api.ensureWelcomeSequence().subscribe({
      next: (seq) => {
        this.sequenceId = seq.id;
        this.message = `Sequence ready: ${seq.code} (#${seq.id})`;
      },
      error: (err) => this.setError(err, 'Failed to ensure sequence'),
    });
  }

  enrollSelectedLead(): void {
    if (!this.selectedLead) {
      return;
    }
    if (!this.sequenceId) {
      this.error = 'Ensure welcome sequence first';
      return;
    }
    const recipient = this.enrollRecipient.trim() || this.selectedLead.phone || this.selectedLead.email;
    if (!recipient) {
      this.error = 'Enter recipient phone/email';
      return;
    }
    this.busy = true;
    this.api
      .enrollSequence({
        sequenceId: this.sequenceId,
        leadId: this.selectedLead.id,
        recipient,
        channel: 'WHATSAPP',
      })
      .subscribe({
        next: () => {
          this.busy = false;
          this.message = `Lead #${this.selectedLead!.id} enrolled`;
          this.loadTimeline(this.selectedLead!.id);
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Enroll failed');
        },
      });
  }

  processSequences(): void {
    this.api.processDueSequences().subscribe({
      next: (r) => {
        this.message = `Sequences: processed ${r.processed}, completed ${r.completed}, failed ${r.failed}`;
      },
      error: (err) => this.setError(err, 'process-due failed'),
    });
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
