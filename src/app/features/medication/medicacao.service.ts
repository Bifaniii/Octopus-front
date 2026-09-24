import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DadosMedicacao, ErroApi, Medicacao } from './medicacao.model';

/**
 * MedicacaoService
 * ----------------
 * Consome o microserviço octopus-msmedications (/api/medicacoes).
 * O token JWT é anexado pelo `authInterceptor`. Leitura: qualquer usuário
 * logado. Cadastro: ROLE_ADMIN ou ROLE_VETERINARIO.
 */
@Injectable({ providedIn: 'root' })
export class MedicacaoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/medicacoes`;

  /** GET /api/medicacoes — catálogo completo (ativos e inativos). */
  listar(): Observable<Medicacao[]> {
    return this.http.get<Medicacao[]>(this.baseUrl);
  }

  /** POST /api/medicacoes */
  criar(dados: DadosMedicacao): Observable<Medicacao> {
    return this.http.post<Medicacao>(this.baseUrl, dados);
  }

  /** Traduz o erro HTTP em uma mensagem amigável para exibir na tela. */
  mensagemDeErro(e: HttpErrorResponse): string {
    const corpo = e.error as Partial<ErroApi> | null;
    switch (e.status) {
      case 0:
        return 'Não foi possível conectar ao servidor de medicamentos. Verifique se a API está no ar.';
      case 401:
        return 'Sua sessão expirou. Entre novamente.';
      case 403:
        return 'Apenas administradores e veterinários podem cadastrar medicamentos.';
      case 400: {
        const campos = corpo?.campos ? Object.values(corpo.campos) : [];
        return campos.length ? campos.join(' · ') : (corpo?.mensagem ?? 'Dados inválidos.');
      }
      case 404:
      case 409:
      case 422:
        return corpo?.mensagem ?? 'Não foi possível salvar o medicamento.';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }
}