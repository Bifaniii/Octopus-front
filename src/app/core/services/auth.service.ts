import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Role, Usuario } from '../models/usuario.model';

/**
 * AuthService
 * -----------
 * Fonte única da verdade sobre "quem está logado". Consome o endpoint
 * POST /api/auth/login do back-end, guarda o token JWT e expõe o
 * usuário atual como signal.
 *
 * As guardas de rota (`authGuard`, `permissaoGuard`) e o
 * `authInterceptor` consultam este serviço.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  private static readonly TOKEN_KEY = 'octopus.token';
  private static readonly USUARIO_KEY = 'octopus.usuario';

  private readonly _usuario = signal<Usuario | null>(this.lerSessao());

  /** Usuário logado (ou null). Somente leitura para o resto da app. */
  readonly usuario = this._usuario.asReadonly();

  /** Atalho reativo: há alguém logado? */
  readonly estaLogado = computed(() => this._usuario() !== null);

  /**
   * Faz login na API. Em caso de sucesso, guarda token + usuário.
   * Retorna o Observable para o componente tratar sucesso/erro.
   */
  login(credenciais: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, credenciais)
      .pipe(tap((resp) => this.guardarSessao(resp)));
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(AuthService.TOKEN_KEY);
      localStorage.removeItem(AuthService.USUARIO_KEY);
    }
    this._usuario.set(null);
  }

  /** Token JWT atual, para o interceptor anexar no header Authorization. */
  get token(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  /** true se o usuário logado tem um dos papéis informados. */
  temRole(roles: Role[]): boolean {
    const u = this._usuario();
    return u !== null && roles.includes(u.role);
  }

  private guardarSessao(resp: LoginResponse): void {
    const usuario: Usuario = { email: resp.email, role: resp.role };
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(AuthService.TOKEN_KEY, resp.token);
      localStorage.setItem(AuthService.USUARIO_KEY, JSON.stringify(usuario));
    }
    this._usuario.set(usuario);
  }

  /** Reidrata a sessão a partir do que foi salvo (só no browser). */
  private lerSessao(): Usuario | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const bruto = localStorage.getItem(AuthService.USUARIO_KEY);
    if (!bruto) {
      return null;
    }
    try {
      return JSON.parse(bruto) as Usuario;
    } catch {
      return null;
    }
  }
}
