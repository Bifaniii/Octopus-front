import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErroApi } from '../baias/baia.model';
import { Acao, Animal, DadosAdmissao, Internacao, InternacaoEvento } from './internacao.model';

/**
 * InternacaoService
 * -----------------
 * Consome o microsserviço ms-internacao (/api/internacoes) e, para o formulário de admissão, a lista de
 * animais do msusuario (/api/animais). Guarda as internações em um signal e o atualiza após cada escrita.
 *
 * O token JWT é anexado pelo `authInterceptor`. Leitura: qualquer usuário logado. Escrita: conforme o
 * perfil (ver ACOES em internacao.model.ts); quem decide é o @PreAuthorize do back.
 */
@Injectable({ providedIn: 'root' })
export class InternacaoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/internacoes`;
  private readonly animaisUrl = `${environment.apiBaseUrl}/animais`;

  private readonly _internacoes = signal<Internacao[]>([]);
  private readonly _carregando = signal(false);

  readonly internacoes = this._internacoes.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  /** GET /api/internacoes — recarrega a lista inteira (o filtro de abertas é feito na tela). */
  carregar(): Observable<Internacao[]> {
    this._carregando.set(true);
    return this.http.get<Internacao[]>(this.baseUrl).pipe(
      tap((lista) => this._internacoes.set(lista)),
      finalize(() => this._carregando.set(false)),
    );
  }

  /** POST /api/internacoes — RN-01 e RN-02 são conferidas no back. */
  admitir(dados: DadosAdmissao): Observable<Internacao> {
    return this.http
      .post<Internacao>(this.baseUrl, dados)
      .pipe(tap((nova) => this._internacoes.update((lista) => [nova, ...lista])));
  }

  /**
   * PATCH /api/internacoes/{id}/<acao>. O corpo depende da ação: `{ baiaId }` para isolar,
   * `{ termoResponsabilidade }` para a alta a pedido, `{ dataSaida }` para encerrar; as outras não têm corpo.
   */
  executar(id: string, acao: Acao, corpo: object | null = null): Observable<Internacao> {
    return this.http
      .patch<Internacao>(`${this.baseUrl}/${id}/${acao}`, corpo)
      .pipe(tap((atualizada) => this.substituir(atualizada)));
  }

  /** GET /api/internacoes?animalId= — todas as passagens do animal pela clínica, abertas e encerradas. */
  doAnimal(animalId: string): Observable<Internacao[]> {
    return this.http.get<Internacao[]>(this.baseUrl, { params: { animalId } });
  }

  /** GET /api/internacoes/{id}/eventos — histórico, do mais antigo para o mais recente. */
  eventos(id: string): Observable<InternacaoEvento[]> {
    return this.http.get<InternacaoEvento[]>(`${this.baseUrl}/${id}/eventos`);
  }

  /** GET /api/animais (msusuario) — só ADMIN e RECEPCIONISTA, os mesmos perfis que admitem. */
  animais(): Observable<Animal[]> {
    return this.http.get<Animal[]>(this.animaisUrl);
  }

  /** Traduz o erro HTTP em uma mensagem para a tela. O back já manda o texto da regra (RN-01, RN-02...). */
  mensagemDeErro(e: HttpErrorResponse): string {
    const corpo = e.error as Partial<ErroApi> | null;
    switch (e.status) {
      case 0:
        return 'Não foi possível conectar ao servidor de internação. Verifique se a API está no ar.';
      case 401:
        return 'Sua sessão expirou. Entre novamente.';
      case 403:
        return 'Seu perfil não tem permissão para esta ação.';
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
        return corpo?.mensagem ?? 'Não foi possível concluir a operação.';
      case 502:
      case 503:
        return corpo?.mensagem ?? 'Um dos serviços (baias ou animais) está fora do ar. Tente em instantes.';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }

  private substituir(internacao: Internacao): void {
    this._internacoes.update((lista) => lista.map((i) => (i.id === internacao.id ? internacao : i)));
  }
}
