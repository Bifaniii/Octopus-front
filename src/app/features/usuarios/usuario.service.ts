import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminResponse,
  AuxiliarOuRecepcionistaResponse,
  DadosAdmin,
  DadosAuxiliarOuRecepcionista,
  DadosVeterinario,
  DetalheUsuario,
  ErroApi,
  FiltrosUsuario,
  RECURSO_POR_PERFIL,
  RoleCriavel,
  UsuarioListagem,
  VeterinarioResponse,
} from './usuario.model';

/**
 * UsuarioService
 * --------------
 * Consome o octopus-msusuario. A listagem vem de GET /api/usuarios, que junta os quatro perfis e aplica os
 * filtros no banco; o cadastro e a desativação continuam no recurso de cada papel (/api/admins,
 * /api/veterinarios, /api/auxiliares, /api/recepcionistas). Tudo exige ROLE_ADMIN (regra do back-end) — o
 * authInterceptor já anexa o token.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  private readonly _usuarios = signal<UsuarioListagem[]>([]);
  private readonly _carregando = signal(false);

  readonly usuarios = this._usuarios.asReadonly();
  readonly carregando = this._carregando.asReadonly();

  /** GET /api/usuarios com os filtros preenchidos. */
  carregar(filtros: FiltrosUsuario): Observable<UsuarioListagem[]> {
    let params = new HttpParams();
    if (filtros.nome.trim()) params = params.set('nome', filtros.nome.trim());
    if (filtros.perfil) params = params.set('perfil', filtros.perfil);
    if (filtros.situacao) params = params.set('ativo', String(filtros.situacao === 'ativos'));
    if (filtros.cadastradoDe) params = params.set('cadastradoDe', filtros.cadastradoDe);
    if (filtros.cadastradoAte) params = params.set('cadastradoAte', filtros.cadastradoAte);

    this._carregando.set(true);
    return this.http.get<UsuarioListagem[]>(`${this.apiBase}/usuarios`, { params }).pipe(
      tap((lista) => this._usuarios.set(lista)),
      finalize(() => this._carregando.set(false)),
    );
  }

  /** POST /api/admins */
  criarAdmin(dados: DadosAdmin): Observable<AdminResponse> {
    return this.http.post<AdminResponse>(`${this.apiBase}/admins`, dados);
  }

  /** POST /api/veterinarios */
  criarVeterinario(dados: DadosVeterinario): Observable<VeterinarioResponse> {
    return this.http.post<VeterinarioResponse>(`${this.apiBase}/veterinarios`, dados);
  }

  /** POST /api/auxiliares */
  criarAuxiliar(dados: DadosAuxiliarOuRecepcionista): Observable<AuxiliarOuRecepcionistaResponse> {
    return this.http.post<AuxiliarOuRecepcionistaResponse>(`${this.apiBase}/auxiliares`, dados);
  }

  /** POST /api/recepcionistas */
  criarRecepcionista(dados: DadosAuxiliarOuRecepcionista): Observable<AuxiliarOuRecepcionistaResponse> {
    return this.http.post<AuxiliarOuRecepcionistaResponse>(`${this.apiBase}/recepcionistas`, dados);
  }

  podeDesativar(usuario: UsuarioListagem): boolean {
    return usuario.ativo && RECURSO_POR_PERFIL[usuario.role as RoleCriavel] !== undefined;
  }

  temDetalhe(usuario: UsuarioListagem): boolean {
    return RECURSO_POR_PERFIL[usuario.role as RoleCriavel] !== undefined;
  }

  /** GET /api/<perfil>/{perfilId}: CPF ou CNPJ, nascimento, telefone e, para o veterinário, CRMV e especialização. */
  detalhe(usuario: UsuarioListagem): Observable<DetalheUsuario> {
    const recurso = RECURSO_POR_PERFIL[usuario.role as RoleCriavel];
    return this.http.get<DetalheUsuario>(`${this.apiBase}/${recurso}/${usuario.perfilId}`);
  }

  /** PATCH /api/<perfil>/{perfilId}/desativar. Nada é apagado: a conta fica inativa e perde o acesso. */
  desativar(usuario: UsuarioListagem): Observable<void> {
    const recurso = RECURSO_POR_PERFIL[usuario.role as RoleCriavel];
    return this.http.patch(`${this.apiBase}/${recurso}/${usuario.perfilId}/desativar`, null).pipe(
      tap(() => this._usuarios.update((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, ativo: false } : u)))),
      map(() => undefined),
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
}
