import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';
import {
  AssignRolePermissionsRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  WorkspaceRole,
} from '../../models/role.model';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  constructor(private readonly api: ApiService) {}

  private endpoint(organizationId: string): string {
    return `organizations/${organizationId}/roles`;
  }

  getRoles(organizationId: string): Observable<WorkspaceRole[]> {
    return this.api.get<WorkspaceRole[]>(
      this.endpoint(organizationId),
    );
  }

  getRole(
    organizationId: string,
    roleId: string,
  ): Observable<WorkspaceRole> {
    return this.api.get<WorkspaceRole>(
      `${this.endpoint(organizationId)}/${roleId}`,
    );
  }

  createRole(
    organizationId: string,
    payload: CreateRoleRequest,
  ): Observable<WorkspaceRole> {
    return this.api.post<WorkspaceRole>(
      this.endpoint(organizationId),
      payload,
    );
  }

  updateRole(
    organizationId: string,
    roleId: string,
    payload: UpdateRoleRequest,
  ): Observable<WorkspaceRole> {
    return this.api.patch<WorkspaceRole>(
      `${this.endpoint(organizationId)}/${roleId}`,
      payload,
    );
  }

  replacePermissions(
    organizationId: string,
    roleId: string,
    payload: AssignRolePermissionsRequest,
  ): Observable<WorkspaceRole> {
    return this.api.put<WorkspaceRole>(
      `${this.endpoint(organizationId)}/${roleId}/permissions`,
      payload,
    );
  }

  deleteRole(
    organizationId: string,
    roleId: string,
  ): Observable<void> {
    return this.api.delete<void>(
      `${this.endpoint(organizationId)}/${roleId}`,
    );
  }
}