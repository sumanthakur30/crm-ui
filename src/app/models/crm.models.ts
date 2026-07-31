export interface LeadUpsert {
  title: string;
  displayName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  sourceCode?: string | null;
  status?: string | null;
  priority?: string | null;
  score?: number | null;
  ownerUserId?: string | null;
  teamId?: string | null;
  amount?: number | null;
  currency?: string | null;
  pipelineId?: number | null;
  stageId?: number | null;
  attributes?: Record<string, unknown>;
  externalRefs?: Record<string, unknown>;
  formKey?: string | null;
  campaignId?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  accountId?: number | null;
  contactId?: number | null;
}

export interface Lead {
  id: number;
  tenantId: string;
  pipelineId?: number | null;
  stageId?: number | null;
  title: string;
  displayName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  sourceCode?: string | null;
  status?: string | null;
  priority?: string | null;
  score: number;
  ownerUserId?: string | null;
  teamId?: string | null;
  amount?: number | null;
  currency?: string | null;
  campaignId?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  externalRefs?: Record<string, unknown>;
  accountId?: number | null;
  contactId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmAccount {
  id: number;
  name: string;
  gstin?: string | null;
  phone?: string | null;
  email?: string | null;
  stateCode?: string | null;
  pincode?: string | null;
  attributes?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrmContact {
  id: number;
  accountId?: number | null;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  attributes?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Campaign {
  id: number;
  code: string;
  name: string;
  status: string;
  channel?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  landingUrl?: string | null;
  publicKey: string;
  capturePath: string;
  createdAt?: string;
}

export interface CampaignUpsert {
  code: string;
  name: string;
  status?: string | null;
  channel?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  landingUrl?: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface WorkspaceBootstrapRequest {
  name?: string | null;
  templateCode?: string | null;
}

export interface Workspace {
  id: number;
  tenantId: string;
  name: string;
  templateCode?: string | null;
  timezone?: string | null;
  currency?: string | null;
  defaultPipelineId?: number | null;
}

export interface ImportResult {
  totalRows: number;
  created: number;
  skipped: number;
  errors: string[];
}

export interface StatusResponse {
  service: string;
  phase: string;
  entitlementCheckEnabled: boolean;
  convertEnabled?: boolean;
  ctiEnabled?: boolean;
  inboundSigningEnabled?: boolean;
}

/** Snapshot from GET /api/v1/crm/entitlements — drives tab gating. */
export interface EntitlementsSnapshot {
  checksEnabled: boolean;
  features: Record<string, boolean>;
  modules: {
    leads?: boolean;
    quotes?: boolean;
    campaigns?: boolean;
    ai?: boolean;
    sequences?: boolean;
    approvals?: boolean;
    automation?: boolean;
    ops?: boolean;
    cases?: boolean;
  };
}

/** Minimal support case (FEATURE_CRM_CASES) — CSAT on resolve. */
export interface CrmCase {
  id: number;
  subject: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED' | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  relatedLeadId?: number | null;
  relatedOpportunityId?: number | null;
  assignedTo?: string | null;
  csatScore?: number | null;
  csatComment?: string | null;
  csatSubmittedAt?: string | null;
  csatPublicToken?: string | null;
  csatPublicPath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Pipeline {
  id: number;
  code: string;
  name: string;
  objectType: string;
  isDefault: boolean;
}

export interface Stage {
  id: number;
  pipelineId: number;
  code: string;
  name: string;
  sortOrder: number;
  probability: number;
  won: boolean;
  lost: boolean;
}

export interface TeamMember {
  id: number;
  teamId: string;
  userId: string;
  displayName?: string | null;
  active: boolean;
  sortOrder: number;
}

export interface TimelineItem {
  kind: string;
  id: number;
  eventType: string;
  summary: string;
  actorUserId?: string | null;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

export interface OpportunityUpsert {
  name: string;
  leadId?: number | null;
  accountId?: number | null;
  pipelineId?: number | null;
  stageId?: number | null;
  amount?: number | null;
  currency?: string | null;
  probability?: number | null;
  expectedCloseDate?: string | null;
  status?: string | null;
  ownerUserId?: string | null;
  teamId?: string | null;
  attributes?: Record<string, unknown>;
  closeReasonCode?: string | null;
  closeReasonNote?: string | null;
}

export interface OpportunityStageMove {
  closeReasonCode?: string | null;
  closeReasonNote?: string | null;
}

export interface CloseReason {
  id: number;
  code: string;
  name: string;
  outcome: string;
  sortOrder: number;
  active: boolean;
}

export interface Opportunity {
  id: number;
  tenantId: string;
  pipelineId?: number | null;
  stageId?: number | null;
  leadId?: number | null;
  accountId?: number | null;
  name: string;
  amount?: number | null;
  currency?: string | null;
  probability: number;
  expectedCloseDate?: string | null;
  status?: string | null;
  ownerUserId?: string | null;
  teamId?: string | null;
  attributes?: Record<string, unknown>;
  closeReasonCode?: string | null;
  closeReasonNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteLine {
  description: string;
  hsn?: string | null;
  qty: number;
  unitPrice: number;
  gstRate: number;
  discount?: number | null;
}

export interface QuotationUpsert {
  opportunityId: number;
  customerName?: string | null;
  customerGstin?: string | null;
  placeOfSupply?: string | null;
  sellerStateCode?: string | null;
  buyerStateCode?: string | null;
  currency?: string | null;
  discountAmount?: number | null;
  terms?: string | null;
  validUntil?: string | null;
  lines: QuoteLine[];
}

export interface Quotation {
  id: number;
  opportunityId: number;
  quoteNumber: string;
  versionNo: number;
  parentQuotationId?: number | null;
  status: string;
  approvalStatus?: string | null;
  approvalId?: number | null;
  customerName?: string | null;
  customerGstin?: string | null;
  placeOfSupply?: string | null;
  sellerStateCode?: string | null;
  buyerStateCode?: string | null;
  currency?: string | null;
  taxableAmount?: number | null;
  cgstAmount?: number | null;
  sgstAmount?: number | null;
  igstAmount?: number | null;
  totalAmount?: number | null;
  discountAmount?: number | null;
  terms?: string | null;
  lines?: Record<string, unknown>[];
  sharePayload?: Record<string, unknown>;
  validUntil?: string | null;
  acceptedAt?: string | null;
  createdAt?: string;
  paymentLinkUrl?: string | null;
  paymentStatus?: string | null;
  paymentProvider?: string | null;
  paymentRef?: string | null;
  paymentAmount?: number | null;
  paidAt?: string | null;
}

export interface SequenceStep {
  id?: number;
  sortOrder: number;
  delayHours: number;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS' | string;
  subjectTemplate?: string | null;
  bodyTemplate: string;
}

export interface Sequence {
  id: number;
  code: string;
  name: string;
  channelDefault: string;
  active: boolean;
  steps: SequenceStep[];
}

export interface SequenceUpsert {
  code: string;
  name: string;
  channelDefault?: string | null;
  steps?: SequenceStep[] | null;
}

export interface CrmTag {
  id: number;
  code: string;
  name: string;
  color?: string | null;
}

export interface CrmAttachment {
  id: number;
  objectType: string;
  objectId: number;
  fileName: string;
  contentType?: string | null;
  storageUrl?: string | null;
  sizeBytes?: number | null;
  note?: string | null;
  createdAt?: string;
}

export interface FieldForceEmbedConfig {
  enabled: boolean;
  visitUrlTemplate: string;
  openInNewTab: boolean;
}

