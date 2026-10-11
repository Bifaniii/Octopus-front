import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ErroApi } from '../animais/animal.model';
import { DadosTutor, Tutor } from './tutor.model';

/**
 * TutorService
 * ------------
 * Consome o octopus-msusuario (/api/tutores). Guarda a lista em um signal e atualiza esse signal depois de
 * cada escrita. O token JWT é anexado pelo `authInterceptor`. Perfis: ADMIN e RECEPCIONISTA.
 */
@Injectable({ providedIn: 'root' })
export class TutorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/tutores`;

  private readonly _tutores = signal<Tutor[]>([]);
  private readonly _carregando = signal(false);

  readonly tutores = this._tutores.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  /** GET /api/tutores — recarrega a lista inteira. */
  carregar(): Observable<Tutor[]> {
    this._carregando.set(true);
    return this.http.get<Tutor[]>(this.baseUrl).pipe(
      tap((lista) => this._tutores.set(lista)),
      finalize(() => this._carregando.set(false)),
    );
  }

  /** POST /api/tutores */
  criar(dados: DadosTutor): Observable<Tutor> {
    return this.http
      .post<Tutor>(this.baseUrl, dados)
      .pipe(tap((novo) => this._tutores.update((lista) => [...lista, novo])));
  }

  /** Traduz o erro HTTP em uma mensagem amigável para exibir na tela. */
  mensagemDeErro(e: HttpErrorResponse): string {
    const corpo = e.error as Partial<ErroApi> | null;
    switch (e.status) {
      case 0:
        return 'Não foi possível conectar ao servidor. Verifique se a API está no ar.';
      case 401:
        return 'Sua sessão expirou. Entre novamente.';
      case 403:
        return 'Apenas administradores e recepcionistas podem cadastrar tutores.';
      case 400: {
        const campos = corpo?.campos ? Object.entries(corpo.campos) : [];
        if (campos.length) {
          return campos.map(([campo, msg]) => `${campo}: ${msg}`).join(' · ');
        }
        return corpo?.mensagem ?? 'Dados inválidos.';
      }
      case 409:
        return corpo?.mensagem ?? 'Já existe um tutor com esse CPF.';
      case 404:
      case 422:
        return corpo?.mensagem ?? 'Não foi possível salvar o tutor.';
      case 502:
      case 503:
        return 'O serviço de tutores está fora do ar. Tente em instantes.';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }
}
