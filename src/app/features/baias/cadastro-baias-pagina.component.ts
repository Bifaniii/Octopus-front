import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { BaiaCardComponent } from './baia-card/baia-card.component';
import { BaiaDialogoComponent } from './baia-dialogo/baia-dialogo.component';
import { BaiaService } from './baia.service';
import { Baia, DadosBaia, LIMITE_BAIAS, TipoBaia } from './baia.model';

const SECOES: { tipo: TipoBaia; titulo: string }[] = [
  { tipo: 'ISOLAMENTO', titulo: 'Baias de Isolamento' },
  { tipo: 'COLETIVA', titulo: 'Baias Coletivas' },
  { tipo: 'NINHADA', titulo: 'Baias de Ninhada' },
];

/** Atalho de serviço mostrado no topo da tela. O ícone é uma classe do bootstrap-icons. */
interface Servico {
  nome: string;
  icone: string;
}

/**
 * CadastroBaiasPaginaComponent
 * ----------------------------
 * Componente de ROTA do painel de baias. Busca os dados no BaiaService
 * (API ms-cadastro-baias), agrupa por tipo, monta os cards e controla o
 * diálogo de cadastro/edição. Só administradores podem cadastrar/editar.
 * A moldura (sidebar, cabeçalho, tema) vem do AppShellComponent compartilhado.
 */
@Component({
  selector: 'app-cadastro-baias-pagina',
  standalone: true,
  imports: [AppShellComponent, BaiaCardComponent, BaiaDialogoComponent],
  templateUrl: './cadastro-baias-pagina.component.html',
  styleUrl: './cadastro-baias-pagina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastroBaiasPaginaComponent {
  private readonly baiaService = inject(BaiaService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly baias = this.baiaService.baias;
  protected readonly carregando = this.baiaService.carregando;
  protected readonly dataHoje = this.formatarData(new Date());
  protected readonly limite = LIMITE_BAIAS;

  /** Só o ADMIN pode criar/editar/desativar (regra do back-end). */
  protected readonly podeEditar = computed(() => this.auth.temRole(['ROLE_ADMIN']));
  /** O back-end conta todas as baias (inclusive inativas) no limite. */
  protected readonly limiteAtingido = computed(() => this.baias().length >= LIMITE_BAIAS);

  /** Erro ao carregar a lista. */
  protected readonly erroLista = signal<string | null>(null);

  /** `null` = diálogo fechado. `{ baia: null }` = nova baia. `{ baia }` = edição. */
  protected readonly dialogo = signal<{ baia: Baia | null } | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroDialogo = signal<string | null>(null);

  protected readonly servicos: Servico[] = [
    { nome: 'Agendamento', icone: 'bi-calendar-check' },
    { nome: 'Prontuários', icone: 'bi-clipboard2-check' },
    { nome: 'Estoque', icone: 'bi-box-seam' },
  ];

  protected readonly grupos = computed(() => {
    const todas = this.baias();
    return SECOES.map((s) => ({
      ...s,
      baias: todas
        .filter((b) => b.tipo === s.tipo)
        .sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true })),
    })).filter((g) => g.baias.length > 0);
  });

  constructor() {
    // Só no navegador: no SSR não há token (localStorage) nem proxy para /api.
    afterNextRender(() => this.recarregar());
  }

  protected recarregar(): void {
    this.erroLista.set(null);
    this.baiaService.carregar().subscribe({
      error: (e: HttpErrorResponse) => {
        if (this.sessaoExpirou(e)) return;
        this.erroLista.set(this.baiaService.mensagemDeErro(e));
      },
    });
  }

  protected novaBaia(): void {
    this.abrirDialogo(null);
  }

  protected editarBaia(baia: Baia): void {
    if (this.podeEditar()) {
      this.abrirDialogo(baia);
    }
  }

  protected fecharDialogo(): void {
    this.dialogo.set(null);
  }

  protected salvar(dados: DadosBaia): void {
    const atual = this.dialogo()?.baia;
    this.executar(
      atual ? this.baiaService.atualizar(atual.id, dados) : this.baiaService.criar(dados),
    );
  }

  protected desativar(): void {
    const atual = this.dialogo()?.baia;
    if (atual) {
      this.executar(this.baiaService.desativar(atual.id));
    }
  }

  private abrirDialogo(baia: Baia | null): void {
    this.erroDialogo.set(null);
    this.salvando.set(false);
    this.dialogo.set({ baia });
  }

  /** Roda uma escrita na API: fecha o diálogo no sucesso, mostra o erro na falha. */
  private executar(chamada: Observable<Baia>): void {
    this.salvando.set(true);
    this.erroDialogo.set(null);
    chamada.subscribe({
      next: () => {
        this.salvando.set(false);
        this.dialogo.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        if (this.sessaoExpirou(e)) return;
        this.erroDialogo.set(this.baiaService.mensagemDeErro(e));
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

  private formatarData(data: Date): string {
    const texto = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(data);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
