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
