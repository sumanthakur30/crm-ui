import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Campaign,
  CampaignUpsert,
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
  LeadUpsert,
  Opportunity,
  OpportunityStageMove,
  OpportunityUpsert,
  Page,
  Pipeline,
  Quotation,
  QuotationUpsert,
  Sequence,
  SequenceUpsert,
  Stage,
  StatusResponse,
  TeamMember,
  TimelineItem,
  Workspace,
  WorkspaceBootstrapRequest,
} from '../models/crm.models';

@Injectable({ providedIn: 'root' })
export class CrmApiService {
  private readonly base = '/api/v1/crm';

  constructor(private readonly http: HttpClient) {}

  status(): Observable<StatusResponse> {
    return this.http.get<StatusResponse>(`${this.base}/status`);
  }

  entitlements(): Observable<EntitlementsSnapshot> {
    return this.http.get<EntitlementsSnapshot>(`${this.base}/entitlements`);
  }

  listTemplates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/templates`);
  }

  bootstrap(body: WorkspaceBootstrapRequest = {}): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.base}/workspaces/bootstrap`, body);
  }

  currentWorkspace(): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.base}/workspaces/current`);
  }

  listPipelines(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(`${this.base}/pipelines`);
  }

  listStages(pipelineId: number): Observable<Stage[]> {
    return this.http.get<Stage[]>(`${this.base}/pipelines/${pipelineId}/stages`);
  }

  listLeads(q?: string, page = 0, size = 200): Observable<Page<Lead>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<Page<Lead>>(`${this.base}/leads`, { params });
  }

  getLead(id: number): Observable<Lead> {
    return this.http.get<Lead>(`${this.base}/leads/${id}`);
  }

  createLead(body: LeadUpsert): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/leads`, body);
  }

  updateLead(id: number, body: LeadUpsert): Observable<Lead> {
    return this.http.put<Lead>(`${this.base}/leads/${id}`, body);
  }

  moveStage(leadId: number, stageId: number): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/leads/${leadId}/stage/${stageId}`, {});
  }

  assignLead(leadId: number, body: { mode: string; ownerUserId?: string | null; teamId?: string | null }): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/leads/${leadId}/assign`, body);
  }

  timeline(leadId: number): Observable<TimelineItem[]> {
    return this.http.get<TimelineItem[]>(`${this.base}/leads/${leadId}/timeline`);
  }

  addNote(leadId: number, body: string): Observable<unknown> {
    return this.http.post(`${this.base}/leads/${leadId}/notes`, { body });
  }

  listMembers(teamId = 'DEFAULT'): Observable<TeamMember[]> {
    const params = new HttpParams().set('teamId', teamId);
    return this.http.get<TeamMember[]>(`${this.base}/assignment/members`, { params });
  }

  upsertMember(body: {
    teamId?: string;
    userId: string;
    displayName?: string;
    active?: boolean;
    sortOrder?: number;
  }): Observable<TeamMember> {
    return this.http.post<TeamMember>(`${this.base}/assignment/members`, body);
  }

  importLeads(file: File, assignRoundRobin = false): Observable<ImportResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    const params = new HttpParams().set('assignRoundRobin', String(assignRoundRobin));
    return this.http.post<ImportResult>(`${this.base}/leads/import`, form, { params });
  }

  listOpportunities(q?: string, page = 0, size = 200): Observable<Page<Opportunity>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<Page<Opportunity>>(`${this.base}/opportunities`, { params });
  }

  createOpportunity(body: OpportunityUpsert): Observable<Opportunity> {
    return this.http.post<Opportunity>(`${this.base}/opportunities`, body);
  }

  moveOpportunityStage(
    id: number,
    stageId: number,
    body?: OpportunityStageMove
  ): Observable<Opportunity> {
    return this.http.post<Opportunity>(`${this.base}/opportunities/${id}/stage/${stageId}`, body ?? {});
  }

  listCloseReasons(outcome?: string): Observable<CloseReason[]> {
    let params = new HttpParams();
    if (outcome?.trim()) {
      params = params.set('outcome', outcome.trim());
    }
    return this.http.get<CloseReason[]>(`${this.base}/close-reasons`, { params });
  }

  createQuotation(body: QuotationUpsert): Observable<Quotation> {
    return this.http.post<Quotation>(`${this.base}/quotations`, body);
  }

  listQuotationsForOpportunity(opportunityId: number): Observable<Quotation[]> {
    return this.http.get<Quotation[]>(`${this.base}/quotations/by-opportunity/${opportunityId}`);
  }

  sendQuotation(id: number, body?: { channel?: string; recipient?: string }): Observable<Quotation> {
    return this.http.post<Quotation>(`${this.base}/quotations/${id}/send`, body ?? {});
  }

  acceptQuotation(id: number): Observable<Quotation> {
    return this.http.post<Quotation>(`${this.base}/quotations/${id}/accept`, {});
  }

  reviseQuotation(id: number): Observable<Quotation> {
    return this.http.post<Quotation>(`${this.base}/quotations/${id}/revise`, {});
  }

  requestQuoteDiscountApproval(id: number): Observable<Quotation> {
    return this.http.post<Quotation>(`${this.base}/quotations/${id}/request-discount-approval`, {});
  }

  createPaymentLink(id: number): Observable<Quotation> {
    return this.http.post<Quotation>(`${this.base}/quotations/${id}/payment-link`, {});
  }

  markQuotePaid(id: number): Observable<Quotation> {
    return this.http.post<Quotation>(`${this.base}/quotations/${id}/mark-paid`, {});
  }

  quotationPdfUrl(id: number): string {
    return `${this.base}/quotations/${id}/pdf`;
  }

  downloadQuotationPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/quotations/${id}/pdf`, { responseType: 'blob' });
  }

  analyticsSummary(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/analytics/summary`);
  }

  pipelineAnalytics(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/analytics/pipeline`);
  }

  processSlaAging(): Observable<{ tasksCreated: number; openOverdueTasks: number }> {
    return this.http.post<{ tasksCreated: number; openOverdueTasks: number }>(
      `${this.base}/tasks/sla/process-aging`,
      {}
    );
  }

  listOpenTasks(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/tasks`);
  }

  completeTask(id: number): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/tasks/${id}/complete`, {});
  }

  myDay(hotMinScore?: number, hotLimit?: number): Observable<Record<string, unknown>> {
    let params = new HttpParams();
    if (hotMinScore != null) {
      params = params.set('hotMinScore', hotMinScore);
    }
    if (hotLimit != null) {
      params = params.set('hotLimit', hotLimit);
    }
    return this.http.get<Record<string, unknown>>(`${this.base}/my-day`, { params });
  }

  listActivities(opts?: {
    from?: string;
    to?: string;
    types?: string;
    limit?: number;
  }): Observable<Array<Record<string, unknown>>> {
    let params = new HttpParams();
    if (opts?.from) {
      params = params.set('from', opts.from);
    }
    if (opts?.to) {
      params = params.set('to', opts.to);
    }
    if (opts?.types) {
      params = params.set('types', opts.types);
    }
    if (opts?.limit != null) {
      params = params.set('limit', opts.limit);
    }
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/activities`, { params });
  }

  convertLead(id: number, targetSystem: string): Observable<Record<string, unknown>> {
    const params = new HttpParams().set('targetSystem', targetSystem);
    return this.http.post<Record<string, unknown>>(`${this.base}/leads/${id}/convert`, {}, { params });
  }

  convertLeadToCrm(
    id: number,
    body: {
      accountMode: 'CREATE' | 'EXISTING';
      accountId?: number | null;
      account?: Partial<CrmAccount> | null;
      contactMode: 'CREATE' | 'EXISTING' | 'NONE';
      contactId?: number | null;
      contact?: Partial<CrmContact> | null;
      createOpportunity: boolean;
      opportunity?: { name?: string; amount?: number | null; currency?: string | null } | null;
      markLeadConverted?: boolean;
    }
  ): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/leads/${id}/convert-to-crm`, body);
  }

  ensureWelcomeSequence(): Observable<Sequence> {
    return this.http.post<Sequence>(`${this.base}/sequences/ensure-welcome`, {});
  }

  listSequences(): Observable<Sequence[]> {
    return this.http.get<Sequence[]>(`${this.base}/sequences`);
  }

  upsertSequence(body: SequenceUpsert): Observable<Sequence> {
    return this.http.post<Sequence>(`${this.base}/sequences`, body);
  }

  enrollSequence(body: {
    sequenceId: number;
    leadId?: number | null;
    opportunityId?: number | null;
    recipient: string;
    channel?: string;
  }): Observable<unknown> {
    return this.http.post(`${this.base}/sequences/enrollments`, body);
  }

  processDueSequences(limit = 20): Observable<{ processed: number; completed: number; failed: number }> {
    return this.http.post<{ processed: number; completed: number; failed: number }>(
      `${this.base}/sequences/process-due?limit=${limit}`,
      {}
    );
  }

  sendMessage(body: {
    leadId: number;
    channel: string;
    recipient?: string | null;
    subject?: string | null;
    body: string;
    templateCode?: string | null;
  }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/messages/send`, body);
  }

  listSequenceEnrollments(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/sequences/enrollments`);
  }

  pauseSequenceEnrollment(id: number): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/sequences/enrollments/${id}/pause`, {});
  }

  resumeSequenceEnrollment(id: number): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/sequences/enrollments/${id}/resume`, {});
  }

  cancelSequenceEnrollment(id: number): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/sequences/enrollments/${id}/cancel`, {});
  }

  retrySequenceEnrollment(id: number): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/sequences/enrollments/${id}/retry`, {});
  }

  fieldForceEmbedConfig(): Observable<FieldForceEmbedConfig> {
    return this.http.get<FieldForceEmbedConfig>(`${this.base}/field-force/embed-config`);
  }

  listTags(): Observable<CrmTag[]> {
    return this.http.get<CrmTag[]>(`${this.base}/tags`);
  }

  createTag(body: { code: string; name: string; color?: string }): Observable<CrmTag> {
    return this.http.post<CrmTag>(`${this.base}/tags`, body);
  }

  listObjectTags(objectType: string, objectId: number): Observable<CrmTag[]> {
    return this.http.get<CrmTag[]>(`${this.base}/tags/assignments/${objectType}/${objectId}`);
  }

  assignTag(objectType: string, objectId: number, tagId: number): Observable<CrmTag[]> {
    return this.http.post<CrmTag[]>(`${this.base}/tags/assignments/${objectType}/${objectId}`, { tagId });
  }

  removeTag(objectType: string, objectId: number, tagId: number): Observable<CrmTag[]> {
    return this.http.delete<CrmTag[]>(`${this.base}/tags/assignments/${objectType}/${objectId}/${tagId}`);
  }

  listAttachments(objectType: string, objectId: number): Observable<CrmAttachment[]> {
    return this.http.get<CrmAttachment[]>(`${this.base}/attachments/${objectType}/${objectId}`);
  }

  createAttachment(
    objectType: string,
    objectId: number,
    body: { fileName: string; contentType?: string; storageUrl?: string; note?: string; sizeBytes?: number }
  ): Observable<CrmAttachment> {
    return this.http.post<CrmAttachment>(`${this.base}/attachments/${objectType}/${objectId}`, body);
  }

  deleteAttachment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/attachments/${id}`);
  }

  listCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.base}/campaigns`);
  }

  upsertCampaign(body: CampaignUpsert): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.base}/campaigns`, body);
  }

  publicCapture(publicKey: string, body: Record<string, unknown>): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/public/capture/${publicKey}`, body);
  }

  ensureScoreRules(): Observable<Array<Record<string, unknown>>> {
    return this.http.post<Array<Record<string, unknown>>>(`${this.base}/scoring/rules/ensure-defaults`, {});
  }

  scoreEvent(leadId: number, eventType: string, summary?: string): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/scoring/leads/${leadId}/events`, { eventType, summary });
  }

  rescoreLead(leadId: number): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/scoring/leads/${leadId}/rescore`, {});
  }

  forecast(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/ops/forecast`);
  }

  upsertForecastCommit(body: {
    periodYm: string;
    amount: number;
    note?: string;
  }): Observable<Record<string, unknown>> {
    return this.http.put<Record<string, unknown>>(`${this.base}/ops/forecast/commits`, body);
  }

  listApprovals(status = 'PENDING'): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/ops/approvals`, {
      params: new HttpParams().set('status', status),
    });
  }

  requestApproval(body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/ops/approvals`, body);
  }

  decideApproval(id: number, approve: boolean): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      `${this.base}/ops/approvals/${id}/decide?approve=${approve}`,
      {}
    );
  }

  listStageAutomationRules(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/automation/stage-rules`);
  }

  createStageAutomationRule(body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/automation/stage-rules`, body);
  }

  setStageAutomationActive(id: number, active: boolean): Observable<Record<string, unknown>> {
    const path = active ? 'activate' : 'deactivate';
    return this.http.post<Record<string, unknown>>(`${this.base}/automation/stage-rules/${id}/${path}`, {});
  }

  logCall(body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/ops/calls`, body);
  }

  createCalendar(body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/ops/calendar`, body);
  }

  runReports(): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/reports/run-due`, {});
  }

  upsertReportSchedule(body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/reports/schedules`, body);
  }

  ensureFieldAcl(): Observable<Array<Record<string, unknown>>> {
    return this.http.post<Array<Record<string, unknown>>>(`${this.base}/acl/fields/ensure-defaults`, {});
  }

  listFieldAcl(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/acl/fields`);
  }

  adapterIngest(provider: string, body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/adapters/${provider}`, body);
  }

  adapterEvents(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/adapters/events`);
  }

  findDuplicates(leadId: number): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/leads/${leadId}/duplicates`);
  }

  mergeLeads(survivorId: number, duplicateId: number): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/leads/${survivorId}/merge/${duplicateId}`, {});
  }

  listDuplicateRules(objectType = 'LEAD'): Observable<Array<Record<string, unknown>>> {
    const params = new HttpParams().set('objectType', objectType);
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/duplicate-rules`, { params });
  }

  upsertDuplicateRule(body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/duplicate-rules`, body);
  }

  listAccounts(): Observable<CrmAccount[]> {
    return this.http.get<CrmAccount[]>(`${this.base}/accounts`);
  }

  getAccount(id: number): Observable<CrmAccount> {
    return this.http.get<CrmAccount>(`${this.base}/accounts/${id}`);
  }

  getAccountSummary(id: number): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/accounts/${id}/summary`);
  }

  accountTimeline(id: number): Observable<TimelineItem[]> {
    return this.http.get<TimelineItem[]>(`${this.base}/accounts/${id}/timeline`);
  }

  addAccountNote(id: number, body: string): Observable<unknown> {
    return this.http.post(`${this.base}/accounts/${id}/notes`, { body });
  }

  upsertAccount(body: Partial<CrmAccount> & { name: string }): Observable<CrmAccount> {
    return this.http.post<CrmAccount>(`${this.base}/accounts`, body);
  }

  listContacts(accountId?: number): Observable<CrmContact[]> {
    let params = new HttpParams();
    if (accountId != null) {
      params = params.set('accountId', accountId);
    }
    return this.http.get<CrmContact[]>(`${this.base}/contacts`, { params });
  }

  upsertContact(
    body: Partial<CrmContact> & { displayName: string }
  ): Observable<CrmContact> {
    return this.http.post<CrmContact>(`${this.base}/contacts`, body);
  }

  // —— Phase 4 AI ——
  summarizeLead(leadId: number, language?: string): Observable<Record<string, unknown>> {
    let params = new HttpParams();
    if (language) {
      params = params.set('language', language);
    }
    return this.http.post<Record<string, unknown>>(`${this.base}/ai/leads/${leadId}/summarize`, {}, { params });
  }

  nextBestAction(leadId: number, language?: string): Observable<Record<string, unknown>> {
    let params = new HttpParams();
    if (language) {
      params = params.set('language', language);
    }
    return this.http.post<Record<string, unknown>>(`${this.base}/ai/leads/${leadId}/nba`, {}, { params });
  }

  explainScore(leadId: number, language?: string): Observable<Record<string, unknown>> {
    let params = new HttpParams();
    if (language) {
      params = params.set('language', language);
    }
    return this.http.post<Record<string, unknown>>(`${this.base}/ai/leads/${leadId}/score-explain`, {}, { params });
  }

  churnUpsell(leadId: number, language?: string): Observable<Record<string, unknown>> {
    let params = new HttpParams();
    if (language) {
      params = params.set('language', language);
    }
    return this.http.post<Record<string, unknown>>(`${this.base}/ai/leads/${leadId}/churn-upsell`, {}, { params });
  }

  draftMessage(leadId: number, channel = 'WHATSAPP', language?: string): Observable<Record<string, unknown>> {
    let params = new HttpParams().set('channel', channel);
    if (language) {
      params = params.set('language', language);
    }
    return this.http.post<Record<string, unknown>>(`${this.base}/ai/leads/${leadId}/draft`, {}, { params });
  }

  winPredict(opportunityId: number, language?: string): Observable<Record<string, unknown>> {
    let params = new HttpParams();
    if (language) {
      params = params.set('language', language);
    }
    return this.http.post<Record<string, unknown>>(
      `${this.base}/ai/opportunities/${opportunityId}/win-predict`,
      {},
      { params }
    );
  }

  ocrCard(body: Record<string, unknown>, language?: string): Observable<Record<string, unknown>> {
    let params = new HttpParams();
    if (language) {
      params = params.set('language', language);
    }
    return this.http.post<Record<string, unknown>>(`${this.base}/ai/ocr/card`, body, { params });
  }

  copilot(body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/ai/copilot`, body);
  }

  listAiInsights(relatedType: string, relatedId: number): Observable<Array<Record<string, unknown>>> {
    const params = new HttpParams().set('relatedType', relatedType).set('relatedId', relatedId);
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/ai/insights`, { params });
  }

  // —— Phase 4 Enterprise ——
  enterpriseSettings(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/enterprise/settings`);
  }

  updateEnterpriseSettings(body: Record<string, unknown>): Observable<Record<string, unknown>> {
    return this.http.put<Record<string, unknown>>(`${this.base}/enterprise/settings`, body);
  }

  ssoStatus(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/enterprise/sso`);
  }

  ssoHandshakeStatus(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/sso/status`);
  }

  ssoAuthorize(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/sso/authorize`);
  }

  meters(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/meters`);
  }

  setSeatsUsed(used: number): Observable<Record<string, unknown>> {
    return this.http.put<Record<string, unknown>>(`${this.base}/meters/seats`, { used });
  }

  requestAuditExport(body: Record<string, unknown> = {}): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/enterprise/audit-exports`, body);
  }

  listAuditExports(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/enterprise/audit-exports`);
  }

  // —— Cases + CSAT (minimal) ——
  listCases(status?: string): Observable<CrmCase[]> {
    let params = new HttpParams();
    if (status?.trim()) {
      params = params.set('status', status.trim());
    }
    return this.http.get<CrmCase[]>(`${this.base}/cases`, { params });
  }

  getCase(id: number): Observable<CrmCase> {
    return this.http.get<CrmCase>(`${this.base}/cases/${id}`);
  }

  createCase(body: Record<string, unknown>): Observable<CrmCase> {
    return this.http.post<CrmCase>(`${this.base}/cases`, body);
  }

  updateCaseStatus(id: number, body: Record<string, unknown>): Observable<CrmCase> {
    return this.http.put<CrmCase>(`${this.base}/cases/${id}/status`, body);
  }

  submitCaseCsat(id: number, body: { score: number; comment?: string }): Observable<CrmCase> {
    return this.http.post<CrmCase>(`${this.base}/cases/${id}/csat`, body);
  }

  clickToDial(body: {
    phone: string;
    leadId?: number | null;
    opportunityId?: number | null;
    caseId?: number | null;
  }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/cti/click-to-dial`, body);
  }
}
