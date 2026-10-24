import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioDetalheComponent } from './usuario-detalhe/usuario-detalhe.component';
import { UsuarioDialogoComponent } from './usuario-dialogo/usuario-dialogo.component';
import { UsuarioService } from './usuario.service';
import {
  DetalheUsuario,
  EdicaoUsuarioEvento,
  FILTROS_VAZIOS,
  FiltrosUsuario,
  NOME_POR_ROLE,
  NovoUsuarioEvento,
  UsuarioListagem,
} from './usuario.model';

/**
 * CadastroUsuariosPaginaComponent
 * --------------------------------
 * Componente de ROTA da tela de usuários. Só é alcançável por quem
 * tem ROLE_ADMIN (ver `authGuard` + `permissaoGuard` em app.routes.ts).
 * Lista os usuários com os filtros aplicados no back (GET /api/usuarios),
 * controla o diálogo de cadastro e a desativação. A moldura
 * (sidebar, cabeçalho, tema) vem do AppShellComponent compartilhado.
 */
@Component({
  selector: 'app-cadastro-usuarios-pagina',
  standalone: true,
  imports: [AppShellComponent, UsuarioDialogoComponent, UsuarioDetalheComponent],
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
  protected readonly perfis = Object.entries(NOME_POR_ROLE);

  /** Filtros em edição na barra; só valem depois de "Filtrar". */
  protected readonly filtros = signal<FiltrosUsuario>({ ...FILTROS_VAZIOS });
  protected readonly filtrosAtivos = signal(false);
  /** Linha aguardando o segundo clique de "Desativar". */
  protected readonly confirmandoDesativar = signal<string | null>(null);
  protected readonly erroAcao = signal<string | null>(null);

  /** Usuário com a ficha aberta e o estado da busca dos dados do perfil. */
  protected readonly selecionado = signal<UsuarioListagem | null>(null);
  protected readonly detalhe = signal<DetalheUsuario | null>(null);
  protected readonly carregandoDetalhe = signal(false);
  protected readonly erroDetalhe = signal<string | null>(null);
  protected readonly desativando = signal(false);
  protected readonly ativando = signal(false);
  protected readonly editandoFicha = signal(false);
  protected readonly salvandoEdicao = signal(false);
  protected readonly erroEdicao = signal<string | null>(null);

  /** Mesma regra do back: só o admin edita usuários (PUT em /api/<perfil>/{id}). */
  protected get podeEditar(): boolean {
    return this.auth.temRole(['ROLE_ADMIN']);
  }

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

  protected alterarFiltro(campo: keyof FiltrosUsuario, valor: string): void {
    this.filtros.update((f) => ({ ...f, [campo]: valor }));
  }

  protected filtrar(): void {
    const f = this.filtros();
    if (f.cadastradoDe && f.cadastradoAte && f.cadastradoDe > f.cadastradoAte) {
      this.erroLista.set('A data inicial do cadastro não pode ser depois da final.');
      return;
    }
    this.filtrosAtivos.set(Object.values(f).some((v) => v !== ''));
    this.recarregar();
  }

  protected limparFiltros(): void {
    this.filtros.set({ ...FILTROS_VAZIOS });
    this.filtrosAtivos.set(false);
    this.recarregar();
  }

  protected podeAtivar(u: UsuarioListagem): boolean {
    return this.usuarioService.podeAtivar(u);
  }

  protected podeDesativar(u: UsuarioListagem): boolean {
    return this.usuarioService.podeDesativar(u);
  }

  protected abrirFicha(u: UsuarioListagem): void {
    this.editandoFicha.set(false);
    this.erroEdicao.set(null);
    this.selecionado.set(u);
    this.detalhe.set(null);
    this.erroDetalhe.set(null);
    if (!this.usuarioService.temDetalhe(u)) return;
    this.carregandoDetalhe.set(true);
    this.usuarioService.detalhe(u).subscribe({
      next: (d) => {
        this.carregandoDetalhe.set(false);
        this.detalhe.set(d);
      },
      error: (e: HttpErrorResponse) => {
        this.carregandoDetalhe.set(false);
        if (this.sessaoExpirou(e)) return;
        this.erroDetalhe.set(this.usuarioService.mensagemDeErro(e));
      },
    });
  }

  protected fecharFicha(): void {
    this.selecionado.set(null);
    this.editandoFicha.set(false);
  }

  protected editarFicha(): void {
    this.erroEdicao.set(null);
    this.editandoFicha.set(true);
  }

  protected cancelarEdicao(): void {
    this.editandoFicha.set(false);
  }

  protected salvarEdicao(edicao: EdicaoUsuarioEvento): void {
    const u = this.selecionado();
    if (!u) return;
    this.salvandoEdicao.set(true);
    this.erroEdicao.set(null);
    this.usuarioService.atualizar(u, edicao).subscribe({
      next: (resposta) => {
        this.salvandoEdicao.set(false);
        this.editandoFicha.set(false);
        this.selecionado.set({ ...u, nome: resposta.nome, email: resposta.usuario.email });
        if ('telefone' in resposta) this.detalhe.set(resposta);
      },
      error: (e: HttpErrorResponse) => {
        this.salvandoEdicao.set(false);
        if (this.sessaoExpirou(e)) return;
        this.erroEdicao.set(this.usuarioService.mensagemDeErro(e));
      },
    });
  }

  /** Desativação pedida dentro da ficha, que já confirmou com o segundo clique. */
  protected desativarDaFicha(u: UsuarioListagem): void {
    this.desativando.set(true);
    this.erroDetalhe.set(null);
    this.usuarioService.desativar(u).subscribe({
      next: () => {
        this.desativando.set(false);
        this.selecionado.set({ ...u, ativo: false });
      },
      error: (e: HttpErrorResponse) => {
        this.desativando.set(false);
        if (this.sessaoExpirou(e)) return;
        this.erroDetalhe.set(this.usuarioService.mensagemDeErro(e));
      },
    });
  }

  /** Reativação pedida dentro da ficha. */
  protected ativarDaFicha(u: UsuarioListagem): void {
    this.ativando.set(true);
    this.erroDetalhe.set(null);
    this.usuarioService.ativar(u).subscribe({
      next: () => {
        this.ativando.set(false);
        this.selecionado.set({ ...u, ativo: true });
      },
      error: (e: HttpErrorResponse) => {
        this.ativando.set(false);
        if (this.sessaoExpirou(e)) return;
        this.erroDetalhe.set(this.usuarioService.mensagemDeErro(e));
      },
    });
  }

  /** Reativar não destrói nada, então é um clique só. */
  protected ativar(u: UsuarioListagem): void {
    this.erroAcao.set(null);
    this.usuarioService.ativar(u).subscribe({
      error: (e: HttpErrorResponse) => {
        if (this.sessaoExpirou(e)) return;
        this.erroAcao.set(this.usuarioService.mensagemDeErro(e));
      },
    });
  }

  /** Dois cliques: o primeiro pede confirmação na própria linha, sem diálogo do navegador. */
  protected desativar(u: UsuarioListagem): void {
    if (this.confirmandoDesativar() !== u.id) {
      this.confirmandoDesativar.set(u.id);
      return;
    }
    this.confirmandoDesativar.set(null);
    this.erroAcao.set(null);
    this.usuarioService.desativar(u).subscribe({
      error: (e: HttpErrorResponse) => {
        if (this.sessaoExpirou(e)) return;
        this.erroAcao.set(this.usuarioService.mensagemDeErro(e));
      },
    });
  }

  /** aaaa-MM-ddTHH:mm:ss → dd/MM/aaaa, sem passar por Date. */
  protected data(valor: string): string {
    const [ano, mes, dia] = valor.slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
  }

  protected recarregar(): void {
    this.erroLista.set(null);
    this.usuarioService.carregar(this.filtros()).subscribe({
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
        this.recarregar();
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
