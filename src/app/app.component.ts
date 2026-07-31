import { Component, OnInit } from '@angular/core';
import { CrmApiService } from './core/crm-api.service';
import { TenantService } from './core/tenant.service';
import { AuthSessionService } from './core/auth-session.service';
import {
  Campaign,
  CloseReason,
  CrmAccount,
  CrmAttachment,
  CrmCase,
  CrmContact,
  CrmTag,
  EntitlementsSnapshot,
  FieldForceEmbedConfig,
  ImportResult,
  Lead,
  Opportunity,
  Pipeline,
  Quotation,
  Sequence,
  SequenceStep,
  Stage,
  TeamMember,
  TimelineItem,
  Workspace,
} from './models/crm.models';

export interface LeadKanbanColumn {
  stage: Stage;
  leads: Lead[];
}

export interface DealKanbanColumn {
  stage: Stage;
  opps: Opportunity[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'SugamFlow CRM';
  module:
    | 'leads'
    | 'deals'
    | 'quotes'
    | 'insights'
    | 'campaigns'
    | 'accounts'
    | 'ops'
    | 'cases'
    | 'enterprise' = 'leads';
  view: 'list' | 'kanban' = 'kanban';
  /** Cached for template — getters that allocate each CD cycle freeze Chrome ("Page Unresponsive"). */
  kanbanColumns: LeadKanbanColumn[] = [];
  dealKanbanColumns: DealKanbanColumn[] = [];
  hasAuthToken = false;

  tenantDraft = '';
  shopDraft = '';
  workspaceName = 'Demo Workspace';
  convertEnabled = false;
  ctiEnabled = false;
  inboundSigningEnabled = false;
  lastConvert: Record<string, unknown> | null = null;
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
  accounts: CrmAccount[] = [];
  contacts: CrmContact[] = [];
  leadContacts: CrmContact[] = [];
  selectedAccount: CrmAccount | null = null;
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

  /** Prompt when moving a deal into a won/lost stage. */
  closePrompt: {
    opp: Opportunity;
    stageId: number;
    outcome: 'WON' | 'LOST';
  } | null = null;
  closeReasons: CloseReason[] = [];
  closeReasonCode = '';
  closeReasonNote = '';

  memberForm = { userId: '', displayName: '' };

  leadForm = {
    title: '',
    displayName: '',
    companyName: '',
    email: '',
    phone: '',
    sourceCode: 'WEBSITE',
    campaignId: null as number | null,
    accountId: null as number | null,
    contactId: null as number | null,
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
  };

  accountForm = {
    name: '',
    gstin: '',
    phone: '',
    email: '',
    stateCode: '',
    pincode: '',
  };

  contactForm = {
    displayName: '',
    email: '',
    phone: '',
    title: '',
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
    accountId: null as number | null,
  };

  quoteForm = {
    opportunityId: null as number | null,
    customerName: '',
    customerGstin: '',
    placeOfSupply: 'KA',
    sellerStateCode: '29',
    buyerStateCode: '29',
    discountAmount: 0,
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
  sequences: Sequence[] = [];
  sequenceDraft: {
    code: string;
    name: string;
    channelDefault: string;
    steps: Array<{
      delayHours: number;
      channel: string;
      subjectTemplate: string;
      bodyTemplate: string;
    }>;
  } = {
    code: 'WELCOME_FOLLOWUP',
    name: 'Welcome follow-up',
    channelDefault: 'WHATSAPP',
    steps: [],
  };
  enrollRecipient = '';
  enrollChannel = 'WHATSAPP';
  convertTarget: 'SHOP_CUSTOMER' | 'SCHOOL_INQUIRY' | 'FIELD_FORCE' = 'SHOP_CUSTOMER';

  ffEmbed: FieldForceEmbedConfig | null = null;
  ffVisitUrl = '';
  showFfEmbed = false;

  catalogTags: CrmTag[] = [];
  leadTags: CrmTag[] = [];
  tagToAssign: number | null = null;
  leadAttachments: CrmAttachment[] = [];
  attachmentDraft = { fileName: '', storageUrl: '', note: '' };

  offlineNote = '';
  offlineReady = typeof navigator !== 'undefined' ? navigator.onLine : true;
  installPromptEvent: any = null;
  analytics: Record<string, unknown> | null = null;
  dashboardKpis = {
    openDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    overdueTasks: 0,
    pipelineAmount: 0,
  };
  leadFunnel: Array<Record<string, unknown>> = [];
  leadSources: Array<Record<string, unknown>> = [];
  campaignStats: Array<Record<string, unknown>> = [];
  utmSources: Array<Record<string, unknown>> = [];
  dealFunnel: Array<Record<string, unknown>> = [];
  openTasks: Array<Record<string, unknown>> = [];
  forecast: Record<string, unknown> | null = null;
  forecastCommitForm = { periodYm: '', amount: 0, note: '' };

  get forecastCommits(): Array<Record<string, unknown>> {
    const rows = this.forecast?.['commits'];
    return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
  }
  approvals: Array<Record<string, unknown>> = [];
  fieldAcl: Array<Record<string, unknown>> = [];
  adapterEvents: Array<Record<string, unknown>> = [];
  scoreRules: Array<Record<string, unknown>> = [];
  stageAutomationRules: Array<Record<string, unknown>> = [];
  stageRuleForm = {
    objectType: 'OPPORTUNITY' as 'LEAD' | 'OPPORTUNITY',
    toStageCode: 'NEGOTIATION',
    actionType: 'CREATE_TASK' as 'CREATE_TASK' | 'TIMELINE_NOTE',
    title: 'Follow up after stage move',
  };
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
  ssoHandshake: Record<string, unknown> | null = null;
  ssoAuthorizeUrl = '';
  auditExports: Array<Record<string, unknown>> = [];
  aiInsights: Array<Record<string, unknown>> = [];
  lastInsight: Record<string, unknown> | null = null;
  copilotQuestion = '';
  aiLanguage = 'en';

  cases: CrmCase[] = [];
  caseFilterStatus = '';
  caseForm = {
    subject: '',
    priority: 'MEDIUM',
    assignedTo: '',
    relatedLeadId: null as number | null,
    relatedOpportunityId: null as number | null,
  };
  csatDraft: Record<number, { score: number; comment: string }> = {};

  importFile: File | null = null;
  importResult: ImportResult | null = null;
  assignRoundRobin = false;

  busy = false;
  message = '';
  error = '';

  /** When null, treat modules as allowed (fail-open until first fetch). */
  entitlements: EntitlementsSnapshot | null = null;

  constructor(
    private readonly api: CrmApiService,
    readonly tenant: TenantService,
    readonly auth: AuthSessionService
  ) {
    this.tenantDraft = tenant.tenantId;
    this.shopDraft = tenant.shopId;
    this.authTokenDraft = auth.getAccessToken() || '';
    this.authUserDraft = auth.getUsername() || '';
    this.hasAuthToken = !!this.authTokenDraft;
  }

  ngOnInit(): void {
    this.refreshStatus();
    this.loadEntitlements();
    this.loadTemplates();
    this.reloadAll();
    this.loadFfEmbedConfig();
    window.addEventListener('online', () => (this.offlineReady = true));
    window.addEventListener('offline', () => (this.offlineReady = false));
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e;
    });
  }

  promptInstall(): void {
    const ev = this.installPromptEvent;
    if (!ev?.prompt) {
      this.message = 'Install not available in this browser yet — use Add to Home Screen';
      return;
    }
    ev.prompt();
  }

  /** Module gate — true when checks are off or the flag is enabled. */
  can(module: keyof NonNullable<EntitlementsSnapshot['modules']>): boolean {
    if (!this.entitlements) {
      return true;
    }
    if (!this.entitlements.checksEnabled) {
      return true;
    }
    return this.entitlements.modules?.[module] !== false;
  }

  canChannel(channel: 'WHATSAPP' | 'SMS' | 'EMAIL'): boolean {
    if (!this.entitlements?.checksEnabled) {
      return true;
    }
    const f = this.entitlements.features || {};
    const key =
      channel === 'WHATSAPP'
        ? 'FEATURE_CRM_WHATSAPP'
        : channel === 'SMS'
          ? 'FEATURE_CRM_SMS'
          : 'FEATURE_CRM_EMAIL';
    return f[key] !== false;
  }

  upgradeHint(module: string): string {
    return `Upgrade your CRM plan to unlock ${module}. Configure in SugamFlow Super Admin → Platform Subscription.`;
  }

  loadEntitlements(): void {
    this.api.entitlements().subscribe({
      next: (snap) => {
        this.entitlements = snap;
        if (snap.checksEnabled && this.module !== 'leads' && !this.can(this.module as keyof NonNullable<EntitlementsSnapshot['modules']>)) {
          this.module = 'leads';
        }
      },
      error: () => {
        /* keep null → fail-open UI until service is up */
      },
    });
  }

  private rebuildLeadKanban(): void {
    this.kanbanColumns = this.stages.map((stage) => ({
      stage,
      leads: this.leads.filter((l) => Number(l.stageId) === Number(stage.id)),
    }));
  }

  private rebuildDealKanban(): void {
    this.dealKanbanColumns = this.dealStages.map((stage) => ({
      stage,
      opps: this.opportunities.filter((o) => Number(o.stageId) === Number(stage.id)),
    }));
  }

  trackByKanbanCol(_index: number, col: { stage: Stage }): number {
    return col.stage.id;
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  trackByLeadId(_index: number, lead: Lead): number {
    return lead.id;
  }

  trackByOppId(_index: number, opp: Opportunity): number {
    return opp.id;
  }

  setModule(
    m:
      | 'leads'
      | 'deals'
      | 'quotes'
      | 'insights'
      | 'campaigns'
      | 'accounts'
      | 'ops'
      | 'cases'
      | 'enterprise'
  ): void {
    const gateKey =
      m === 'quotes'
        ? 'quotes'
        : m === 'campaigns'
          ? 'campaigns'
          : m === 'enterprise'
            ? 'ai'
            : m === 'ops'
              ? 'ops'
              : m === 'cases'
                ? 'cases'
                : null;
    if (gateKey && !this.can(gateKey)) {
      this.error = this.upgradeHint(m);
      return;
    }
    this.module = m;
    this.error = '';
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
    } else if (m === 'accounts') {
      this.loadAccounts();
    } else if (m === 'ops') {
      this.loadOps();
    } else if (m === 'cases') {
      this.loadCases();
    } else if (m === 'enterprise') {
      this.loadEnterprise();
      if (this.selectedLead) {
        this.loadLeadInsights();
      }
    }
  }

  saveTenant(): void {
    this.tenant.setTenantId(this.tenantDraft);
    this.tenant.setShopId(this.shopDraft);
    this.tenantDraft = this.tenant.tenantId;
    this.shopDraft = this.tenant.shopId;
    this.message = this.shopDraft
      ? `Tenant ${this.tenant.tenantId} · shop ${this.shopDraft}`
      : `Tenant set to ${this.tenant.tenantId}`;
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
    this.hasAuthToken = !!this.auth.getAccessToken();
    this.message = this.hasAuthToken
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
        this.hasAuthToken = !!this.authTokenDraft;
        if (res.shopId) {
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
    this.hasAuthToken = false;
    this.message = 'Logged out';
  }

  refreshStatus(): void {
    this.api.status().subscribe({
      next: (s) => {
        this.convertEnabled = !!s.convertEnabled;
        this.ctiEnabled = !!s.ctiEnabled;
        this.inboundSigningEnabled = !!s.inboundSigningEnabled;
        this.message =
          `${s.service} phase ${s.phase}` +
          (s.convertEnabled ? ' · convert on' : ' · convert off') +
          (s.ctiEnabled ? ' · CTI on' : ' · CTI off') +
          (s.inboundSigningEnabled ? ' · inbound signing on' : ' · inbound signing off');
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
    this.loadEntitlements();
    this.loadLeads();
    this.loadMembers();
    this.loadCurrentWorkspace();
    this.loadOpportunities();
    this.loadAccounts();
    if (this.can('campaigns')) {
      this.loadCampaigns();
    }
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
              this.rebuildLeadKanban();
            },
            error: (err) => this.setError(err, 'Failed to load lead stages'),
          });
        } else {
          this.stages = [];
          this.rebuildLeadKanban();
        }

        if (dealPipe?.id) {
          this.api.listStages(dealPipe.id).subscribe({
            next: (stages) => {
              this.dealStages = (stages || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
              this.rebuildDealKanban();
            },
            error: (err) => this.setError(err, 'Failed to load deal stages'),
          });
        } else {
          this.dealStages = [];
          this.rebuildDealKanban();
        }
      },
      error: () => {
        this.pipelines = [];
        this.stages = [];
        this.dealStages = [];
        this.rebuildLeadKanban();
        this.rebuildDealKanban();
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
        this.rebuildLeadKanban();
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
        this.rebuildDealKanban();
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
        accountId: this.leadForm.accountId,
        contactId: this.leadForm.contactId,
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
            accountId: null,
            contactId: null,
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

  onLeadAccountChange(): void {
    this.leadForm.contactId = null;
    this.leadContacts = [];
    if (this.leadForm.accountId) {
      this.api.listContacts(this.leadForm.accountId).subscribe({
        next: (list) => (this.leadContacts = list || []),
        error: () => (this.leadContacts = []),
      });
    }
  }

  accountName(id?: number | null): string {
    if (id == null) {
      return '—';
    }
    return this.accounts.find((a) => a.id === id)?.name || `#${id}`;
  }

  loadAccounts(): void {
    this.api.listAccounts().subscribe({
      next: (list) => {
        this.accounts = list || [];
        if (this.selectedAccount) {
          const fresh = this.accounts.find((a) => a.id === this.selectedAccount!.id);
          this.selectedAccount = fresh || null;
          if (this.selectedAccount) {
            this.loadContactsForAccount(this.selectedAccount.id);
          }
        }
      },
      error: (err) => this.setError(err, 'Failed to load accounts'),
    });
  }

  selectAccount(account: CrmAccount): void {
    this.selectedAccount = account;
    this.loadContactsForAccount(account.id);
  }

  loadContactsForAccount(accountId: number): void {
    this.api.listContacts(accountId).subscribe({
      next: (list) => (this.contacts = list || []),
      error: (err) => {
        this.contacts = [];
        this.setError(err, 'Failed to load contacts');
      },
    });
  }

  createAccount(): void {
    if (!this.accountForm.name.trim()) {
      this.error = 'Account name is required';
      return;
    }
    this.busy = true;
    this.api
      .upsertAccount({
        name: this.accountForm.name.trim(),
        gstin: this.accountForm.gstin || null,
        phone: this.accountForm.phone || null,
        email: this.accountForm.email || null,
        stateCode: this.accountForm.stateCode || null,
        pincode: this.accountForm.pincode || null,
      })
      .subscribe({
        next: (account) => {
          this.busy = false;
          this.message = `Account ${account.name} saved`;
          this.error = '';
          this.accountForm = { name: '', gstin: '', phone: '', email: '', stateCode: '', pincode: '' };
          this.loadAccounts();
          this.selectAccount(account);
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Save account failed');
        },
      });
  }

  createContact(): void {
    if (!this.selectedAccount) {
      this.error = 'Select an account first';
      return;
    }
    if (!this.contactForm.displayName.trim()) {
      this.error = 'Contact name is required';
      return;
    }
    this.busy = true;
    this.api
      .upsertContact({
        accountId: this.selectedAccount.id,
        displayName: this.contactForm.displayName.trim(),
        email: this.contactForm.email || null,
        phone: this.contactForm.phone || null,
        title: this.contactForm.title || null,
      })
      .subscribe({
        next: () => {
          this.busy = false;
          this.message = 'Contact saved';
          this.error = '';
          this.contactForm = { displayName: '', email: '', phone: '', title: '' };
          this.loadContactsForAccount(this.selectedAccount!.id);
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Save contact failed');
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
    const accountId =
      this.oppForm.accountId ?? fromLead?.accountId ?? null;
    this.busy = true;
    this.api
      .createOpportunity({
        name,
        leadId: fromLead?.id ?? this.oppForm.leadId,
        accountId,
        amount: this.oppForm.amount ?? fromLead?.amount ?? null,
        currency: this.oppForm.currency || fromLead?.currency || 'INR',
      })
      .subscribe({
        next: (opp) => {
          this.busy = false;
          this.message = `Opportunity #${opp.id} created`;
          this.error = '';
          this.oppForm = { name: '', amount: null, currency: 'INR', leadId: null, accountId: null };
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

  onOppLeadChange(): void {
    const lead = this.leads.find((l) => l.id === this.oppForm.leadId);
    if (lead?.accountId && !this.oppForm.accountId) {
      this.oppForm.accountId = lead.accountId;
    }
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
        discountAmount: Number(this.quoteForm.discountAmount) || 0,
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
    this.loadLeadHygiene(lead.id);
    this.loadOfflineNote(lead.id);
    this.refreshFfVisitUrl(lead);
    if (this.can('sequences')) {
      this.loadSequences();
    }
  }

  closeLead(): void {
    this.selectedLead = null;
    this.timeline = [];
    this.leadTags = [];
    this.leadAttachments = [];
    this.showFfEmbed = false;
    this.offlineNote = '';
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
    if (channel === 'WHATSAPP' || channel === 'SMS' || channel === 'EMAIL') {
      if (!this.canChannel(channel)) {
        this.error = this.upgradeHint(channel + ' messaging');
        return;
      }
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
        if (err?.status === 409) {
          this.message = 'Discount approval required — check Ops → Approvals, then send again';
          this.loadOps();
          this.api.listQuotationsForOpportunity(q.opportunityId).subscribe({
            next: (list) => {
              this.quotations = list || [];
              const refreshed = list?.find((x) => x.id === q.id);
              if (refreshed) {
                this.selectedQuote = refreshed;
              }
            },
          });
        }
      },
    });
  }

  reviseQuote(q: Quotation): void {
    this.busy = true;
    this.api.reviseQuotation(q.id).subscribe({
      next: (updated) => {
        this.busy = false;
        this.selectedQuote = updated;
        this.message = `Quote ${updated.quoteNumber} v${updated.versionNo} drafted`;
        this.loadQuotesForOpp(updated.opportunityId);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Revise failed');
      },
    });
  }

  requestQuoteDiscountApproval(q: Quotation): void {
    if (!this.can('approvals')) {
      this.error = this.upgradeHint('Approvals');
      return;
    }
    this.busy = true;
    this.api.requestQuoteDiscountApproval(q.id).subscribe({
      next: (updated) => {
        this.busy = false;
        this.selectedQuote = updated;
        this.message = `Discount approval ${updated.approvalStatus} (#${updated.approvalId})`;
        this.loadQuotesForOpp(updated.opportunityId);
        this.loadOps();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Discount approval request failed');
      },
    });
  }

  acceptQuote(q: Quotation): void {
    this.busy = true;
    this.api.acceptQuotation(q.id).subscribe({
      next: (updated) => {
        this.busy = false;
        this.selectedQuote = updated;
        const share = updated.sharePayload || {};
        const orderId = share['orderId'];
        const orderStatus =
          share['orderCreate'] && typeof share['orderCreate'] === 'object'
            ? String((share['orderCreate'] as Record<string, unknown>)['status'] || '')
            : '';
        this.message =
          `Quote ${updated.quoteNumber} accepted` +
          (orderId ? ` · order ${orderId}` : orderStatus ? ` · order ${orderStatus}` : '');
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
      next: (s) => {
        this.analytics = s;
        this.leadFunnel = this.asRows(s, 'leadFunnel');
        this.leadSources = this.asRows(s, 'leadSources');
        this.campaignStats = this.asRows(s, 'campaigns');
        this.utmSources = this.asRows(s, 'utmSources');
        this.dealFunnel = this.asRows(s, 'dealFunnel');
        const pipelineAmount = this.dealFunnel.reduce((sum, row) => {
          const n = Number(row['amount']);
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);
        this.dashboardKpis = {
          openDeals: Number(s['openDeals'] ?? 0),
          wonDeals: Number(s['wonDeals'] ?? 0),
          lostDeals: Number(s['lostDeals'] ?? 0),
          overdueTasks: Number(s['overdueTasks'] ?? 0),
          pipelineAmount,
        };
      },
      error: (err) => this.setError(err, 'Analytics failed'),
    });
    this.api.listOpenTasks().subscribe({
      next: (t) => (this.openTasks = t || []),
      error: () => (this.openTasks = []),
    });
  }

  private asRows(source: Record<string, unknown> | null, key: string): Array<Record<string, unknown>> {
    const rows = source?.[key];
    return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
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
    this.error = '';
    this.api.convertLead(this.selectedLead.id, this.convertTarget).subscribe({
      next: (res) => {
        this.busy = false;
        this.lastConvert = res;
        const status = String(res['status'] || '');
        const mode = String(res['mode'] || '');
        const externalId = res['externalId'] ? String(res['externalId']) : '';
        const errMsg = res['errorMessage'] ? String(res['errorMessage']) : '';
        if (status === 'FAILED') {
          this.error =
            `Convert ${this.convertTarget} FAILED` +
            (mode ? ` (${mode})` : '') +
            (errMsg ? `: ${errMsg}` : '');
          this.message = '';
        } else if (status === 'SKIPPED') {
          this.message = `Convert stored only (crm.convert.enabled=false)`;
        } else if (status === 'ACKED' || res['alreadyConverted']) {
          this.message =
            `Already converted to ${this.convertTarget}` +
            (externalId ? ` · id ${externalId}` : '');
        } else {
          this.message =
            `Convert ${this.convertTarget}: ${status}` +
            (mode ? ` · ${mode}` : '') +
            (externalId ? ` · id ${externalId}` : '');
        }
        this.api.getLead(this.selectedLead!.id).subscribe({
          next: (lead) => {
            this.selectedLead = lead;
            const idx = this.leads.findIndex((l) => l.id === lead.id);
            if (idx >= 0) {
              this.leads = [...this.leads.slice(0, idx), lead, ...this.leads.slice(idx + 1)];
              this.rebuildLeadKanban();
            }
          },
        });
        this.loadTimeline(this.selectedLead!.id);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Convert failed');
      },
    });
  }

  convertRef(target: string): { status?: string; externalId?: string } | null {
    const refs = this.selectedLead?.externalRefs;
    if (!refs || !refs[target] || typeof refs[target] !== 'object') {
      return null;
    }
    return refs[target] as { status?: string; externalId?: string };
  }

  funnelRows(key: string): Array<Record<string, unknown>> {
    return this.asRows(this.analytics, key);
  }

  loadCampaigns(): void {
    if (!this.can('campaigns')) {
      this.campaigns = [];
      return;
    }
    this.api.listCampaigns().subscribe({
      next: (list) => {
        this.campaigns = list || [];
        if (!this.captureDemo.publicKey && this.campaigns.length) {
          this.captureDemo.publicKey = this.campaigns[0].publicKey;
        }
      },
      error: (err) => {
        const status = err?.status;
        if (status === 403 || status === 402) {
          this.campaigns = [];
          return;
        }
        this.setError(err, 'Failed to load campaigns');
      },
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
      next: (f) => {
        this.forecast = f;
        const period = String(f['periodYm'] || '');
        if (period && !this.forecastCommitForm.periodYm) {
          this.forecastCommitForm.periodYm = period;
        }
      },
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
    if (this.can('automation')) {
      this.api.listStageAutomationRules().subscribe({
        next: (r) => (this.stageAutomationRules = r || []),
        error: () => (this.stageAutomationRules = []),
      });
    } else {
      this.stageAutomationRules = [];
    }
  }

  saveForecastCommit(): void {
    const period = (this.forecastCommitForm.periodYm || '').trim();
    if (!period) {
      this.error = 'Period YYYY-MM required';
      return;
    }
    this.busy = true;
    this.api
      .upsertForecastCommit({
        periodYm: period,
        amount: Number(this.forecastCommitForm.amount) || 0,
        note: this.forecastCommitForm.note || undefined,
      })
      .subscribe({
        next: () => {
          this.busy = false;
          this.message = `Forecast commit saved for ${period}`;
          this.error = '';
          this.loadOps();
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Forecast commit failed');
        },
      });
  }

  loadCases(): void {
    this.api.listCases(this.caseFilterStatus || undefined).subscribe({
      next: (rows) => {
        this.cases = rows || [];
        for (const c of this.cases) {
          if (!this.csatDraft[c.id]) {
            this.csatDraft[c.id] = { score: 5, comment: '' };
          }
        }
      },
      error: (err) => this.setError(err, 'Cases failed to load'),
    });
  }

  createCase(): void {
    if (!this.caseForm.subject.trim()) {
      this.error = 'Case subject is required';
      return;
    }
    this.busy = true;
    this.error = '';
    const body: Record<string, unknown> = {
      subject: this.caseForm.subject.trim(),
      priority: this.caseForm.priority,
    };
    if (this.caseForm.assignedTo.trim()) {
      body['assignedTo'] = this.caseForm.assignedTo.trim();
    }
    if (this.caseForm.relatedLeadId) {
      body['relatedLeadId'] = this.caseForm.relatedLeadId;
    }
    if (this.caseForm.relatedOpportunityId) {
      body['relatedOpportunityId'] = this.caseForm.relatedOpportunityId;
    }
    this.api.createCase(body).subscribe({
      next: () => {
        this.busy = false;
        this.message = 'Case created';
        this.caseForm = {
          subject: '',
          priority: 'MEDIUM',
          assignedTo: '',
          relatedLeadId: null,
          relatedOpportunityId: null,
        };
        this.loadCases();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Create case failed');
      },
    });
  }

  setCaseStatus(c: CrmCase, status: string): void {
    this.busy = true;
    this.api.updateCaseStatus(c.id, { status }).subscribe({
      next: () => {
        this.busy = false;
        this.message = `Case #${c.id} → ${status}`;
        this.loadCases();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Update case status failed');
      },
    });
  }

  submitCsat(c: CrmCase): void {
    const draft = this.csatDraft[c.id] || { score: 5, comment: '' };
    this.busy = true;
    this.api.submitCaseCsat(c.id, { score: draft.score, comment: draft.comment || undefined }).subscribe({
      next: () => {
        this.busy = false;
        this.message = `CSAT ${draft.score}/5 saved for case #${c.id}`;
        this.loadCases();
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'CSAT submit failed');
      },
    });
  }

  copyCsatPublicLink(c: CrmCase): void {
    const path = c.csatPublicPath;
    if (!path) {
      return;
    }
    const text = path.startsWith('http') ? path : `${window.location.origin}${path}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          this.message = `Copied CSAT link for case #${c.id}`;
        },
        () => {
          this.message = text;
        }
      );
    } else {
      this.message = text;
    }
  }

  createStageRule(): void {
    if (!this.can('automation')) {
      this.error = this.upgradeHint('Automation');
      return;
    }
    const title = this.stageRuleForm.title.trim();
    if (!this.stageRuleForm.toStageCode.trim() || !title) {
      this.error = 'Stage code and title/summary are required';
      return;
    }
    this.busy = true;
    const actionConfig =
      this.stageRuleForm.actionType === 'CREATE_TASK'
        ? { title, dueHours: 24, priority: 'MEDIUM' }
        : { summary: title };
    this.api
      .createStageAutomationRule({
        objectType: this.stageRuleForm.objectType,
        toStageCode: this.stageRuleForm.toStageCode.trim().toUpperCase(),
        actionType: this.stageRuleForm.actionType,
        actionConfig,
        active: true,
        sortOrder: 100,
      })
      .subscribe({
        next: () => {
          this.busy = false;
          this.message = 'Stage automation rule saved';
          this.loadOps();
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Stage rule failed');
        },
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

  clickToDialSelected(): void {
    if (!this.selectedLead || !this.ctiEnabled) {
      return;
    }
    const phone = (this.callForm.phone || this.selectedLead.phone || '').trim();
    if (!phone) {
      this.error = 'Phone required for click-to-dial';
      return;
    }
    this.busy = true;
    this.api.clickToDial({ phone, leadId: this.selectedLead.id }).subscribe({
      next: (res) => {
        this.busy = false;
        this.message = `CTI ${res['status'] || 'ok'} · call ${res['callId'] || ''}`;
        this.loadTimeline(this.selectedLead!.id);
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'Click-to-dial failed');
      },
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
        if (this.selectedQuote) {
          this.loadQuotesForOpp(this.selectedQuote.opportunityId);
          this.api.listQuotationsForOpportunity(this.selectedQuote.opportunityId).subscribe({
            next: (list) => {
              this.quotations = list || [];
              const refreshed = list?.find((x) => x.id === this.selectedQuote?.id);
              if (refreshed) {
                this.selectedQuote = refreshed;
              }
            },
          });
        }
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
    this.api.ssoHandshakeStatus().subscribe({
      next: (s) => {
        this.ssoHandshake = s;
        this.ssoAuthorizeUrl = '';
      },
      error: () => (this.ssoHandshake = null),
    });
    this.api.listAuditExports().subscribe({
      next: (rows) => (this.auditExports = rows || []),
      error: () => (this.auditExports = []),
    });
  }

  beginSsoHandshake(): void {
    this.busy = true;
    this.api.ssoAuthorize().subscribe({
      next: (res) => {
        this.busy = false;
        this.ssoAuthorizeUrl = String(res['authorizeUrl'] || '');
        this.message = `SSO handshake state ${res['state']} · ${res['provider']}`;
        this.error = '';
      },
      error: (err) => {
        this.busy = false;
        this.setError(err, 'SSO authorize failed (enable crm.sso + client-id)');
      },
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
    const nextId = Number(stageId);
    if (!Number.isFinite(nextId) || Number(lead.stageId) === nextId) {
      return;
    }
    this.busy = true;
    this.api.moveStage(lead.id, nextId).subscribe({
      next: (updated) => {
        this.busy = false;
        this.message = `Moved to stage ${nextId}`;
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
    const nextId = Number(stageId);
    if (!Number.isFinite(nextId) || Number(opp.stageId) === nextId) {
      return;
    }
    const stage = this.dealStages.find((s) => Number(s.id) === nextId);
    if (stage?.won || stage?.lost) {
      const outcome: 'WON' | 'LOST' = stage.won ? 'WON' : 'LOST';
      this.closePrompt = { opp, stageId: nextId, outcome };
      this.closeReasonCode = '';
      this.closeReasonNote = '';
      this.closeReasons = [];
      this.api.listCloseReasons(outcome).subscribe({
        next: (rows) => {
          this.closeReasons = rows ?? [];
          if (this.closeReasons.length) {
            this.closeReasonCode = this.closeReasons[0].code;
          }
        },
        error: (err) => this.setError(err, 'Failed to load close reasons'),
      });
      return;
    }
    this.executeMoveOpp(opp, nextId);
  }

  cancelClosePrompt(): void {
    this.closePrompt = null;
    this.closeReasonCode = '';
    this.closeReasonNote = '';
    this.closeReasons = [];
  }

  confirmClosePrompt(): void {
    if (!this.closePrompt) {
      return;
    }
    if (!this.closeReasonCode.trim()) {
      this.error = 'Select a close reason';
      return;
    }
    const { opp, stageId } = this.closePrompt;
    this.executeMoveOpp(opp, stageId, {
      closeReasonCode: this.closeReasonCode.trim(),
      closeReasonNote: this.closeReasonNote.trim() || null,
    });
  }

  private executeMoveOpp(
    opp: Opportunity,
    stageId: number,
    body?: { closeReasonCode?: string | null; closeReasonNote?: string | null }
  ): void {
    this.busy = true;
    this.api.moveOpportunityStage(opp.id, stageId, body).subscribe({
      next: (updated) => {
        this.busy = false;
        this.cancelClosePrompt();
        const reason = updated.closeReasonCode ? ` · ${updated.closeReasonCode}` : '';
        this.message = `Deal moved · ${updated.status}${reason}`;
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

  closeReasonLabel(code?: string | null): string {
    if (!code) {
      return '—';
    }
    const hit = this.closeReasons.find((r) => r.code === code);
    return hit ? hit.name : code;
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
        this.selectSequence(seq);
        this.message = `Sequence ready: ${seq.code} (#${seq.id})`;
        this.loadSequences();
      },
      error: (err) => this.setError(err, 'Failed to ensure sequence'),
    });
  }

  loadSequences(): void {
    this.api.listSequences().subscribe({
      next: (list) => {
        this.sequences = list || [];
        if (this.sequenceId) {
          const hit = this.sequences.find((s) => s.id === this.sequenceId);
          if (hit) {
            this.selectSequence(hit);
          }
        } else if (this.sequences.length) {
          this.selectSequence(this.sequences[0]);
        }
      },
      error: () => (this.sequences = []),
    });
  }

  selectSequence(seq: Sequence): void {
    this.sequenceId = seq.id;
    this.sequenceDraft = {
      code: seq.code,
      name: seq.name,
      channelDefault: seq.channelDefault || 'WHATSAPP',
      steps: (seq.steps || []).map((s: SequenceStep) => ({
        delayHours: s.delayHours ?? 0,
        channel: s.channel || 'WHATSAPP',
        subjectTemplate: s.subjectTemplate || '',
        bodyTemplate: s.bodyTemplate || '',
      })),
    };
    if (!this.sequenceDraft.steps.length) {
      this.addSequenceStep();
    }
  }

  onSequencePicked(id: number | null): void {
    if (id == null) {
      return;
    }
    const hit = this.sequences.find((s) => s.id === id);
    if (hit) {
      this.selectSequence(hit);
    }
  }

  startNewSequence(): void {
    this.sequenceId = null;
    this.sequenceDraft = {
      code: 'CUSTOM_' + Date.now().toString(36).toUpperCase(),
      name: 'New sequence',
      channelDefault: 'WHATSAPP',
      steps: [
        {
          delayHours: 0,
          channel: 'WHATSAPP',
          subjectTemplate: '',
          bodyTemplate: 'Hi {{name}}, thanks for connecting.',
        },
      ],
    };
  }

  addSequenceStep(): void {
    this.sequenceDraft.steps.push({
      delayHours: this.sequenceDraft.steps.length ? 24 : 0,
      channel: this.sequenceDraft.channelDefault || 'WHATSAPP',
      subjectTemplate: '',
      bodyTemplate: '',
    });
  }

  removeSequenceStep(index: number): void {
    this.sequenceDraft.steps.splice(index, 1);
  }

  moveSequenceStep(index: number, delta: number): void {
    const next = index + delta;
    if (next < 0 || next >= this.sequenceDraft.steps.length) {
      return;
    }
    const rows = this.sequenceDraft.steps;
    const tmp = rows[index];
    rows[index] = rows[next];
    rows[next] = tmp;
  }

  saveSequenceBuilder(): void {
    if (!this.can('sequences')) {
      this.error = this.upgradeHint('Sequences');
      return;
    }
    const code = this.sequenceDraft.code.trim();
    const name = this.sequenceDraft.name.trim();
    if (!code || !name) {
      this.error = 'Sequence code and name are required';
      return;
    }
    if (!this.sequenceDraft.steps.length) {
      this.error = 'Add at least one step';
      return;
    }
    for (const step of this.sequenceDraft.steps) {
      if (!step.bodyTemplate.trim()) {
        this.error = 'Each step needs a body template';
        return;
      }
    }
    this.busy = true;
    this.api
      .upsertSequence({
        code,
        name,
        channelDefault: this.sequenceDraft.channelDefault,
        steps: this.sequenceDraft.steps.map((s, i) => ({
          sortOrder: (i + 1) * 10,
          delayHours: Number(s.delayHours) || 0,
          channel: s.channel,
          subjectTemplate: s.subjectTemplate.trim() || null,
          bodyTemplate: s.bodyTemplate.trim(),
        })),
      })
      .subscribe({
        next: (seq) => {
          this.busy = false;
          this.message = `Saved ${seq.code} · ${seq.steps?.length || 0} steps`;
          this.selectSequence(seq);
          this.loadSequences();
        },
        error: (err) => {
          this.busy = false;
          this.setError(err, 'Save sequence failed');
        },
      });
  }

  enrollSelectedLead(): void {
    if (!this.selectedLead) {
      return;
    }
    if (!this.sequenceId) {
      this.error = 'Select or save a sequence first';
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
        channel: this.enrollChannel || 'WHATSAPP',
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

  loadLeadHygiene(leadId: number): void {
    this.api.listTags().subscribe({
      next: (t) => (this.catalogTags = t || []),
      error: () => (this.catalogTags = []),
    });
    this.api.listObjectTags('LEAD', leadId).subscribe({
      next: (t) => (this.leadTags = t || []),
      error: () => (this.leadTags = []),
    });
    this.api.listAttachments('LEAD', leadId).subscribe({
      next: (a) => (this.leadAttachments = a || []),
      error: () => (this.leadAttachments = []),
    });
  }

  assignLeadTag(): void {
    if (!this.selectedLead || !this.tagToAssign) {
      return;
    }
    this.api.assignTag('LEAD', this.selectedLead.id, this.tagToAssign).subscribe({
      next: (tags) => {
        this.leadTags = tags || [];
        this.message = 'Tag assigned';
      },
      error: (err) => this.setError(err, 'Tag assign failed'),
    });
  }

  removeLeadTag(tagId: number): void {
    if (!this.selectedLead) {
      return;
    }
    this.api.removeTag('LEAD', this.selectedLead.id, tagId).subscribe({
      next: (tags) => (this.leadTags = tags || []),
      error: (err) => this.setError(err, 'Tag remove failed'),
    });
  }

  addLeadAttachment(): void {
    if (!this.selectedLead) {
      return;
    }
    const fileName = this.attachmentDraft.fileName.trim() || 'note.txt';
    this.api
      .createAttachment('LEAD', this.selectedLead.id, {
        fileName,
        storageUrl: this.attachmentDraft.storageUrl.trim() || undefined,
        note: this.attachmentDraft.note.trim() || undefined,
        contentType: this.attachmentDraft.note.trim() ? 'text/plain' : undefined,
      })
      .subscribe({
        next: () => {
          this.attachmentDraft = { fileName: '', storageUrl: '', note: '' };
          this.message = 'Attachment saved';
          this.loadLeadHygiene(this.selectedLead!.id);
        },
        error: (err) => this.setError(err, 'Attachment failed'),
      });
  }

  deleteLeadAttachment(id: number): void {
    this.api.deleteAttachment(id).subscribe({
      next: () => {
        if (this.selectedLead) {
          this.loadLeadHygiene(this.selectedLead.id);
        }
      },
      error: (err) => this.setError(err, 'Delete attachment failed'),
    });
  }

  loadFfEmbedConfig(): void {
    this.api.fieldForceEmbedConfig().subscribe({
      next: (cfg) => {
        this.ffEmbed = cfg;
        if (this.selectedLead) {
          this.refreshFfVisitUrl(this.selectedLead);
        }
      },
      error: () => (this.ffEmbed = null),
    });
  }

  refreshFfVisitUrl(lead: Lead): void {
    const tpl = this.ffEmbed?.visitUrlTemplate || '';
    this.ffVisitUrl = tpl
      .replace(/\{\{leadId\}\}/g, String(lead.id))
      .replace(/\{\{tenantId\}\}/g, this.tenant.tenantId || '')
      .replace(/\{\{phone\}\}/g, lead.phone || '');
  }

  openFfVisit(): void {
    if (!this.ffVisitUrl) {
      this.error = 'Field Force visit URL not configured';
      return;
    }
    if (this.ffEmbed?.openInNewTab) {
      window.open(this.ffVisitUrl, '_blank', 'noopener');
    } else {
      this.showFfEmbed = true;
    }
  }

  private offlineKey(leadId: number): string {
    return `crm-offline-note:${this.tenant.tenantId}:${leadId}`;
  }

  loadOfflineNote(leadId: number): void {
    try {
      this.offlineNote = localStorage.getItem(this.offlineKey(leadId)) || '';
    } catch {
      this.offlineNote = '';
    }
  }

  saveOfflineNote(): void {
    if (!this.selectedLead) {
      return;
    }
    try {
      localStorage.setItem(this.offlineKey(this.selectedLead.id), this.offlineNote);
      this.message = 'Offline note saved locally';
    } catch {
      this.error = 'Could not write offline note';
    }
  }

  syncOfflineNoteToServer(): void {
    if (!this.selectedLead || !this.offlineNote.trim()) {
      return;
    }
    this.noteDraft = this.offlineNote;
    this.addNote();
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
