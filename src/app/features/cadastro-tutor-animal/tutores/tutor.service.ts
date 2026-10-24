import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { mensagemDosCampos } from '../../../shared/mascaras/mensagens-api';
import { environment } from '../../../../environments/environment';
import { Animal, ErroApi } from '../animais/animal.model';
import { DadosTutor, Tutor } from './tutor.model';

/**
 * TutorService
 * ------------
 * Consome o octopus-msusuario (/api/tutores). Guarda a lista em um signal e atualiza esse signal depois de
 * cada escrita, inclusive as de animal (`registrarAnimal`), já que cada tutor traz os seus animais. O token JWT
 * é anexado pelo `authInterceptor`. Perfis: ADMIN e RECEPCIONISTA.
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

  /** POST /api/tutores — com `animais`, tutor e animais são gravados juntos ou nenhum é. */
  criar(dados: DadosTutor): Observable<Tutor> {
    return this.http
      .post<Tutor>(this.baseUrl, dados)
      .pipe(tap((novo) => this._tutores.update((lista) => [...lista, novo])));
  }

  /** PUT /api/tutores/{id} — só os dados do tutor; os animais não mudam. */
  atualizar(id: number, dados: DadosTutor): Observable<Tutor> {
    return this.http
      .put<Tutor>(`${this.baseUrl}/${id}`, { ...dados, animais: undefined })
      .pipe(tap((atualizado) => this.substituir(atualizado)));
  }

  /** Reflete na lista um animal criado ou editado pelo AnimalService. */
  registrarAnimal(animal: Animal): void {
    this._tutores.update((lista) =>
      lista.map((t) => {
        if (t.id !== animal.tutorId) return t;
        const existe = t.animais.some((a) => a.id === animal.id);
        return {
          ...t,
          animais: existe ? t.animais.map((a) => (a.id === animal.id ? animal : a)) : [...t.animais, animal],
        };
      }),
    );
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
        if (corpo?.campos && Object.keys(corpo.campos).length) {
          return mensagemDosCampos(corpo.campos);
        }
        return corpo?.mensagem ?? 'Dados inválidos.';
      }
      case 404:
      case 409:
      case 422:
        return corpo?.mensagem ?? 'Não foi possível salvar o tutor.';
      case 502:
      case 503:
        return 'O serviço de tutores está fora do ar. Tente em instantes.';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }

  private substituir(atualizado: Tutor): void {
    this._tutores.update((lista) => lista.map((t) => (t.id === atualizado.id ? atualizado : t)));
  }
}
