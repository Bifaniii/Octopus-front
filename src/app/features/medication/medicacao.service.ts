import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medicacao } from './medicacao.model';

/**
 * MedicacaoService
 * ----------------
 * Consome o microserviço octopus-msmedications (/api/medicacoes).
 * O token JWT é anexado pelo `authInterceptor`; a leitura é liberada
 * para qualquer usuário logado.
 */
@Injectable({ providedIn: 'root' })
export class MedicacaoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/medicacoes`;

  /** GET /api/medicacoes — catálogo completo (ativos e inativos). */
  listar(): Observable<Medicacao[]> {
    return this.http.get<Medicacao[]>(this.baseUrl);
  }
}
