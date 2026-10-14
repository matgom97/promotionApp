import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';
import { WorkspaceResponse } from '../../models/workspace/workspace.model';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly endpoint = 'me/workspace';

  constructor(
    private readonly api: ApiService,
  ) {}

  /**
   * Obtiene el workspace de la sede seleccionada.
   */
  getWorkspace(
    restaurantId: string,
  ): Observable<WorkspaceResponse> {
    return this.api.get<WorkspaceResponse>(
      this.endpoint,
      undefined,
      {
        headers: {
          'X-Restaurant-Id': restaurantId,
        },
      },
    );
  }
}