import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Baia, DadosBaia, ErroApi } from './baia.model';

/**
 * BaiaService
 * -----------
 * Consome o microserviço ms-cadastro-baias (/api/baias). Guarda a lista
 * em um signal para a tela reagir, e atualiza o signal após cada escrita.
 *
 * O token JWT é anexado pelo `authInterceptor`. Leitura: qualquer usuário
 * logado. Escrita (criar/editar/desativar): apenas ROLE_ADMIN.
 */
@Injectable({ providedIn: 'root' })
export class BaiaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/baias`;

  private readonly _baias = signal<Baia[]>([]);
  private readonly _carregando = signal(false);

  readonly baias = this._baias.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  /** GET /api/baias — recarrega a lista inteira. */
  carregar(): Observable<Baia[]> {
    this._carregando.set(true);
    return this.http.get<Baia[]>(this.baseUrl).pipe(
      tap((lista) => this._baias.set(lista)),
      finalize(() => this._carregando.set(false)),
    );
  }

  /** POST /api/baias */
  criar(dados: DadosBaia): Observable<Baia> {
    return this.http
      .post<Baia>(this.baseUrl, dados)
      .pipe(tap((nova) => this._baias.update((lista) => [...lista, nova])));
  }

  /** PUT /api/baias/{id} */
  atualizar(id: string, dados: DadosBaia): Observable<Baia> {
    return this.http
      .put<Baia>(`${this.baseUrl}/${id}`, dados)
      .pipe(tap((atualizada) => this.substituir(atualizada)));
  }

  /** PATCH /api/baias/{id}/desativar — o back-end não apaga baias, só arquiva. */
  desativar(id: string): Observable<Baia> {
    return this.http
      .patch<Baia>(`${this.baseUrl}/${id}/desativar`, null)
      .pipe(tap((desativada) => this.substituir(desativada)));
  }

  /** Traduz o erro HTTP em uma mensagem amigável para exibir na tela. */
  mensagemDeErro(e: HttpErrorResponse): string {
    const corpo = e.error as Partial<ErroApi> | null;
    switch (e.status) {
      case 0:
        return 'Não foi possível conectar ao servidor de baias. Verifique se a API está no ar.';
      case 401:
        return 'Sua sessão expirou. Entre novamente.';
      case 403:
        return 'Apenas administradores podem alterar baias.';
      case 400: {
        const campos = corpo?.campos ? Object.entries(corpo.campos) : [];
        if (campos.length) {
          return campos.map(([campo, msg]) => `${campo}: ${msg}`).join(' · ');
        }
        return corpo?.mensagem ?? 'Dados inválidos.';
      }
      case 404:
      case 409:
      case 422:
        return corpo?.mensagem ?? 'Não foi possível salvar a baia.';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }

  private substituir(baia: Baia): void {
    this._baias.update((lista) => lista.map((b) => (b.id === baia.id ? baia : b)));
  }
}
