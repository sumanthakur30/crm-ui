import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ImportResult,
  Lead,
  LeadUpsert,
  Opportunity,
  OpportunityUpsert,
  Page,
  Pipeline,
  Quotation,
  QuotationUpsert,
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

  moveOpportunityStage(id: number, stageId: number): Observable<Opportunity> {
    return this.http.post<Opportunity>(`${this.base}/opportunities/${id}/stage/${stageId}`, {});
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

  processSlaAging(): Observable<{ tasksCreated: number; openOverdueTasks: number }> {
    return this.http.post<{ tasksCreated: number; openOverdueTasks: number }>(
      `${this.base}/tasks/sla/process-aging`,
      {}
    );
  }

  listOpenTasks(): Observable<Array<Record<string, unknown>>> {
    return this.http.get<Array<Record<string, unknown>>>(`${this.base}/tasks`);
  }

  convertLead(id: number, targetSystem: string): Observable<Record<string, unknown>> {
    const params = new HttpParams().set('targetSystem', targetSystem);
    return this.http.post<Record<string, unknown>>(`${this.base}/leads/${id}/convert`, {}, { params });
  }

  ensureWelcomeSequence(): Observable<{ id: number; code: string; name: string }> {
    return this.http.post<{ id: number; code: string; name: string }>(`${this.base}/sequences/ensure-welcome`, {});
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
}
