import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Animal, DadosAnimal, ErroApi } from './animal.model';

/**
 * AnimalService
 * -------------
 * Consome o octopus-msusuario (/api/animais), dono do "animal". Guarda a lista em um signal e atualiza esse
 * signal depois de cada escrita. O token JWT é anexado pelo `authInterceptor`. Leitura e escrita: ADMIN e
 * RECEPCIONISTA (mesmos perfis da admissão).
 */
@Injectable({ providedIn: 'root' })
export class AnimalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/animais`;

  private readonly _animais = signal<Animal[]>([]);
  private readonly _carregando = signal(false);

  readonly animais = this._animais.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  /** GET /api/animais — recarrega a lista inteira. */
  carregar(): Observable<Animal[]> {
    this._carregando.set(true);
    return this.http.get<Animal[]>(this.baseUrl).pipe(
      tap((lista) => this._animais.set(lista)),
      finalize(() => this._carregando.set(false)),
    );
  }

  /** POST /api/animais */
  criar(dados: DadosAnimal): Observable<Animal> {
    return this.http
      .post<Animal>(this.baseUrl, dados)
      .pipe(tap((novo) => this._animais.update((lista) => [...lista, novo])));
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
        return 'Apenas administradores e recepcionistas podem cadastrar animais.';
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
        return corpo?.mensagem ?? 'Não foi possível salvar o animal.';
      case 502:
      case 503:
        return 'O serviço de animais está fora do ar. Tente em instantes.';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }
}
