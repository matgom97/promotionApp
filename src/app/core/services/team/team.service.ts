import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';

import {
  CreateTeamMemberRequest,
  TeamMember,
  TeamMembersQuery,
  TeamMembersResponse,
  UpdateTeamMemberRequest,
  TeamRestaurantOption
} from '../../models/team.model';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  constructor(
    private readonly api: ApiService,
  ) {}

  private membersEndpoint(organizationId: string): string {
    return `organizations/${organizationId}/members`;
  }

  /**
   * Lista los miembros de una organización.
   */
  getMembers(
    organizationId: string,
    query: TeamMembersQuery = {},
  ): Observable<TeamMembersResponse> {
    let params = new HttpParams();

    if (query.page !== undefined) {
      params = params.set('page', query.page);
    }

    if (query.limit !== undefined) {
      params = params.set('limit', query.limit);
    }

    if (query.role) {
      params = params.set('role', query.role);
    }

    if (query.allRestaurants !== undefined) {
      params = params.set(
        'allRestaurants',
        query.allRestaurants,
      );
    }

    if (query.restaurantIds?.length) {
      params = params.set(
        'restaurantIds',
        query.restaurantIds.join(','),
      );
    }

    return this.api.get<TeamMembersResponse>(
      this.membersEndpoint(organizationId),
      params,
    );
  }

  /**
   * Consulta un miembro.
   */
  getMember(
    organizationId: string,
    memberId: string,
  ): Observable<TeamMember> {
    return this.api.get<TeamMember>(
      `${this.membersEndpoint(organizationId)}/${memberId}`,
    );
  }

  /**
   * Agrega un usuario existente a la organización.
   */
  createMember(
    organizationId: string,
    payload: CreateTeamMemberRequest,
  ): Observable<TeamMember> {
    return this.api.post<TeamMember>(
      this.membersEndpoint(organizationId),
      payload,
    );
  }

  /**
   * Modifica el rol o las asignaciones del miembro.
   */
  updateMember(
    organizationId: string,
    memberId: string,
    payload: UpdateTeamMemberRequest,
  ): Observable<TeamMember> {
    return this.api.patch<TeamMember>(
      `${this.membersEndpoint(organizationId)}/${memberId}`,
      payload,
    );
  }

  /**
   * Elimina al miembro de la organización.
   */
  removeMember(
    organizationId: string,
    memberId: string,
  ): Observable<void> {
    return this.api.delete<void>(
      `${this.membersEndpoint(organizationId)}/${memberId}`,
    );
  }

  getRestaurants(
  organizationId: string,
): Observable<TeamRestaurantOption[]> {
  return this.api.get<TeamRestaurantOption[]>(
    `organizations/${organizationId}/restaurants`,
  );
}
}