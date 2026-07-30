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
  createdAt?: string;
  updatedAt?: string;
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
}

export interface Opportunity {
  id: number;
  tenantId: string;
  pipelineId?: number | null;
  stageId?: number | null;
  leadId?: number | null;
  name: string;
  amount?: number | null;
  currency?: string | null;
  probability: number;
  expectedCloseDate?: string | null;
  status?: string | null;
  ownerUserId?: string | null;
  teamId?: string | null;
  attributes?: Record<string, unknown>;
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
  status: string;
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
}
