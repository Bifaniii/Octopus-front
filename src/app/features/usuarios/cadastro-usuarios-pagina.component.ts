import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioDialogoComponent } from './usuario-dialogo/usuario-dialogo.component';
import { UsuarioService } from './usuario.service';
import { NOME_POR_ROLE, NovoUsuarioEvento } from './usuario.model';

/**
 * CadastroUsuariosPaginaComponent
 * --------------------------------
 * Componente de ROTA da tela de usuários. Só é alcançável por quem
 * tem ROLE_ADMIN (ver `authGuard` + `permissaoGuard` em app.routes.ts).
 * Busca a lista (4 endpoints em paralelo, um por papel — ver
 * UsuarioService) e controla o diálogo de cadastro. A moldura
 * (sidebar, cabeçalho, tema) vem do AppShellComponent compartilhado.
 */
@Component({
  selector: 'app-cadastro-usuarios-pagina',
  standalone: true,
  imports: [AppShellComponent, UsuarioDialogoComponent],
  templateUrl: './cadastro-usuarios-pagina.component.html',
  styleUrl: './cadastro-usuarios-pagina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastroUsuariosPaginaComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuarios = this.usuarioService.usuarios;
  protected readonly carregando = this.usuarioService.carregando;
  protected readonly nomePorRole = NOME_POR_ROLE;

  /** Erro ao carregar a lista. */
  protected readonly erroLista = signal<string | null>(null);

  protected readonly dialogoAberto = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erroDialogo = signal<string | null>(null);

  constructor() {
    // Só no navegador: no SSR não há token (localStorage) nem proxy para /api.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.recarregar();
    }
  }

  protected recarregar(): void {
    this.erroLista.set(null);
    this.usuarioService.carregar().subscribe({
      error: (e: HttpErrorResponse) => {
        if (this.sessaoExpirou(e)) return;
        this.erroLista.set(this.usuarioService.mensagemDeErro(e));
      },
    });
  }

  protected novoUsuario(): void {
    this.erroDialogo.set(null);
    this.salvando.set(false);
    this.dialogoAberto.set(true);
  }

  protected fecharDialogo(): void {
    this.dialogoAberto.set(false);
  }

  /** O papel escolhido no diálogo decide qual endpoint do back-end é chamado. */
  protected salvar(evento: NovoUsuarioEvento): void {
    let chamada: Observable<unknown>;
    switch (evento.role) {
      case 'ROLE_ADMIN':
        chamada = this.usuarioService.criarAdmin(evento.dados);
        break;
      case 'ROLE_VETERINARIO':
        chamada = this.usuarioService.criarVeterinario(evento.dados);
        break;
      case 'ROLE_AUXILIAR':
        chamada = this.usuarioService.criarAuxiliar(evento.dados);
        break;
      case 'ROLE_RECEPCIONISTA':
        chamada = this.usuarioService.criarRecepcionista(evento.dados);
        break;
    }

    this.salvando.set(true);
    this.erroDialogo.set(null);
    chamada.subscribe({
      next: () => {
        this.salvando.set(false);
        this.dialogoAberto.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        if (this.sessaoExpirou(e)) return;
        this.erroDialogo.set(this.usuarioService.mensagemDeErro(e));
      },
    });
  }

  /** 401 = token ausente/expirado: limpa a sessão e volta para o login. */
  private sessaoExpirou(e: HttpErrorResponse): boolean {
    if (e.status !== 401) return false;
    this.auth.logout();
    this.router.navigateByUrl('/login');
    return true;
  }
}
