import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, forkJoin, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminResponse,
  AuxiliarOuRecepcionistaResponse,
  DadosAdmin,
  DadosAuxiliarOuRecepcionista,
  DadosVeterinario,
  ErroApi,
  UsuarioListagem,
  UsuarioResponse,
  VeterinarioResponse,
} from './usuario.model';

/**
 * UsuarioService
 * --------------
 * Consome o microserviço octopus-msusuario. Não existe um endpoint
 * único de "usuários": cada papel tem seu próprio recurso REST
 * (/api/admins, /api/veterinarios, /api/auxiliares, /api/recepcionistas).
 * Este serviço chama os 4 em paralelo para montar uma lista única na
 * tela, e expõe um método de criação por papel. Tudo exige ROLE_ADMIN
 * (regra do back-end) — o authInterceptor já anexa o token.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  private readonly _usuarios = signal<UsuarioListagem[]>([]);
  private readonly _carregando = signal(false);

  readonly usuarios = this._usuarios.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  /** GET nos 4 recursos em paralelo — recarrega a lista inteira. */
  carregar(): Observable<UsuarioListagem[]> {
    this._carregando.set(true);
    return forkJoin({
      admins: this.http.get<AdminResponse[]>(`${this.apiBase}/admins`),
      veterinarios: this.http.get<VeterinarioResponse[]>(`${this.apiBase}/veterinarios`),
      auxiliares: this.http.get<AuxiliarOuRecepcionistaResponse[]>(`${this.apiBase}/auxiliares`),
      recepcionistas: this.http.get<AuxiliarOuRecepcionistaResponse[]>(
        `${this.apiBase}/recepcionistas`,
      ),
    }).pipe(
      map(({ admins, veterinarios, auxiliares, recepcionistas }) => [
        ...admins.map((a) => this.paraLinha(a.nome, a.usuario)),
        ...veterinarios.map((v) => this.paraLinha(v.nome, v.usuario)),
        ...auxiliares.map((a) => this.paraLinha(a.nome, a.usuario)),
        ...recepcionistas.map((r) => this.paraLinha(r.nome, r.usuario)),
      ]),
      tap((lista) => this._usuarios.set(lista)),
      finalize(() => this._carregando.set(false)),
    );
  }

  /** POST /api/admins */
  criarAdmin(dados: DadosAdmin): Observable<AdminResponse> {
    return this.http
      .post<AdminResponse>(`${this.apiBase}/admins`, dados)
      .pipe(tap((novo) => this.adicionar(this.paraLinha(novo.nome, novo.usuario))));
  }

  /** POST /api/veterinarios */
  criarVeterinario(dados: DadosVeterinario): Observable<VeterinarioResponse> {
    return this.http
      .post<VeterinarioResponse>(`${this.apiBase}/veterinarios`, dados)
      .pipe(tap((novo) => this.adicionar(this.paraLinha(novo.nome, novo.usuario))));
  }

  /** POST /api/auxiliares */
  criarAuxiliar(dados: DadosAuxiliarOuRecepcionista): Observable<AuxiliarOuRecepcionistaResponse> {
    return this.http
      .post<AuxiliarOuRecepcionistaResponse>(`${this.apiBase}/auxiliares`, dados)
      .pipe(tap((novo) => this.adicionar(this.paraLinha(novo.nome, novo.usuario))));
  }

  /** POST /api/recepcionistas */
  criarRecepcionista(
    dados: DadosAuxiliarOuRecepcionista,
  ): Observable<AuxiliarOuRecepcionistaResponse> {
    return this.http
      .post<AuxiliarOuRecepcionistaResponse>(`${this.apiBase}/recepcionistas`, dados)
      .pipe(tap((novo) => this.adicionar(this.paraLinha(novo.nome, novo.usuario))));
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
        return 'Apenas administradores podem gerenciar usuários.';
      case 400: {
        const campos = corpo?.campos ? Object.entries(corpo.campos) : [];
        if (campos.length) {
          return campos.map(([campo, msg]) => `${campo}: ${msg}`).join(' · ');
        }
        return corpo?.mensagem ?? 'Dados inválidos.';
      }
      case 409:
        return corpo?.mensagem ?? 'Já existe um usuário com esses dados (e-mail, CPF ou CRMV).';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }

  private paraLinha(nome: string, usuario: UsuarioResponse): UsuarioListagem {
    return { id: usuario.id, nome, email: usuario.email, role: usuario.role, ativo: usuario.ativo };
  }

  private adicionar(linha: UsuarioListagem): void {
    this._usuarios.update((lista) => [...lista, linha]);
  }
}
