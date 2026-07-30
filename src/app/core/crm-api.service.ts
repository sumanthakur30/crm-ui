import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ImportResult,
  Lead,
  LeadUpsert,
  Page,
  StatusResponse,
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

  bootstrap(body: WorkspaceBootstrapRequest = {}): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.base}/workspaces/bootstrap`, body);
  }

  currentWorkspace(): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.base}/workspaces/current`);
  }

  listLeads(q?: string, page = 0, size = 50): Observable<Page<Lead>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<Page<Lead>>(`${this.base}/leads`, { params });
  }

  createLead(body: LeadUpsert): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/leads`, body);
  }

  importLeads(file: File, assignRoundRobin = false): Observable<ImportResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    let params = new HttpParams().set('assignRoundRobin', String(assignRoundRobin));
    return this.http.post<ImportResult>(`${this.base}/leads/import`, form, { params });
  }
}
