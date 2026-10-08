import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { BaiaService } from '../baias/baia.service';
import { Baia, CAPACIDADE_MAXIMA, NOME_POR_TIPO } from '../baias/baia.model';
import { InternacaoService } from './internacao.service';
import { InternacaoCardComponent } from './internacao-card/internacao-card.component';
import { AdmissaoDialogoComponent } from './admissao-dialogo/admissao-dialogo.component';
import { AcaoDialogoComponent } from './acao-dialogo/acao-dialogo.component';
import { HistoricoDialogoComponent } from './historico-dialogo/historico-dialogo.component';
import { InternacoesTabelaComponent } from './internacoes-tabela/internacoes-tabela.component';
import {
  Acao,
  Animal,
  DadosAdmissao,
  Internacao,
  InternacaoEvento,
  acoesPara,
  ocupaBaia,
} from './internacao.model';

/** Recarrega o painel sozinho a cada minuto (o TAP não prevê notificação push). */
const INTERVALO_ATUALIZACAO_MS = 60_000;

type Aba = 'mapa' | 'encerradas';

/** Para a busca por nome ignorar maiúsculas e acentos ("bidú" acha "Bidu"). */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

type EstadoDialogo =
  | { tipo: 'admissao' }
  | { tipo: 'acao'; internacao: Internacao; acao: Acao }
  | { tipo: 'historico'; internacao: Internacao };

/** Uma baia do mapa com os animais que estão nela (capacidade 0 = baia que não veio do msbaias). */
interface BlocoBaia {
  id: string;
  titulo: string;
  detalhe: string;
  capacidade: number;
  internacoes: Internacao[];
}

/**
 * InternacaoPaginaComponent
 * -------------------------
 * Componente de ROTA do painel de internação (tela 4). Busca as internações (ms-internacao) e as baias
 * (ms-cadastro-baias), monta o mapa de ocupação e controla os diálogos de admissão, transição e histórico.
 * As ações visíveis dependem do status e do perfil; quem garante as regras (RN-01, RN-02, RN-08) é o back.
 * A aba "Encerradas" lista as internações que já saíram do mapa e as passagens de um animal pela clínica.
 */
@Component({
  selector: 'app-internacao-pagina',
  standalone: true,
  imports: [
    AppShellComponent,
    InternacaoCardComponent,
    AdmissaoDialogoComponent,
    AcaoDialogoComponent,
    HistoricoDialogoComponent,
    InternacoesTabelaComponent,
  ],
  templateUrl: './internacao-pagina.component.html',
  styleUrl: './internacao-pagina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternacaoPaginaComponent {
  private readonly internacaoService = inject(InternacaoService);
  private readonly baiaService = inject(BaiaService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly carregando = computed(
    () => this.internacaoService.carregando() || this.baiaService.carregando(),
  );
  protected readonly erroLista = signal<string | null>(null);

  protected readonly podeAdmitir = computed(() => this.auth.temRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA']));
  private readonly role = computed(() => this.auth.usuario()?.role);

  /** Internações que ainda ocupam baia (tudo menos ENCERRADA). */
  protected readonly abertas = computed(() =>
    this.internacaoService.internacoes().filter((i) => ocupaBaia(i.status)),
  );
  protected readonly baiasAtivas = computed(() => this.baiaService.baias().filter((b) => b.ativo));

  protected readonly ocupacao = computed(() => {
    const mapa: Record<string, number> = {};
    for (const i of this.abertas()) {
      mapa[i.baiaId] = (mapa[i.baiaId] ?? 0) + 1;
    }
    return mapa;
  });

  protected readonly internados = computed(() => new Set(this.abertas().map((i) => i.animalId)));

  protected readonly nomesBaias = computed(() =>
    Object.fromEntries(this.baiaService.baias().map((b) => [b.id, b.nome])),
  );

  /** Mapa: baias ativas em ordem de nome, cada uma com seus animais; depois as baias inativas ou desconhecidas que ainda têm alguém. */
  protected readonly blocos = computed<BlocoBaia[]>(() => {
    const porBaia = new Map<string, Internacao[]>();
    for (const i of this.abertas()) {
      porBaia.set(i.baiaId, [...(porBaia.get(i.baiaId) ?? []), i]);
    }
    const todas = this.baiaService.baias();
    const visiveis = todas
      .filter((b) => b.ativo || porBaia.has(b.id))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));

    const blocos: BlocoBaia[] = visiveis.map((b) => this.bloco(b, porBaia.get(b.id) ?? []));
    for (const [baiaId, internacoes] of porBaia) {
      if (!todas.some((b) => b.id === baiaId)) {
        blocos.push({ id: baiaId, titulo: 'Baia não encontrada', detalhe: baiaId, capacidade: 0, internacoes });
      }
    }
    return blocos;
  });

  protected readonly resumo = computed(() => {
    const abertas = this.abertas();
    const vagas = this.baiasAtivas().reduce(
      (total, b) => total + Math.max(0, this.capacidade(b) - (this.ocupacao()[b.id] ?? 0)),
      0,
    );
    return {
      internados: abertas.length,
      isolamento: abertas.filter((i) => i.status === 'ISOLAMENTO').length,
      aguardandoSaida: abertas.filter((i) => i.status === 'ALTA_AUTORIZADA' || i.status === 'ALTA_A_PEDIDO_DO_TUTOR').length,
      vagas,
    };
  });

  protected readonly aba = signal<Aba>('mapa');
  protected readonly busca = signal('');

  /** Encerradas, da saída mais recente para a mais antiga, filtradas pelo nome do animal. */
  protected readonly encerradas = computed(() => {
    const termo = normalizar(this.busca());
    return this.internacaoService
      .internacoes()
      .filter((i) => i.status === 'ENCERRADA')
      .filter((i) => !termo || normalizar(i.animalNome).includes(termo))
      .sort((a, b) => (b.dataSaida ?? '').localeCompare(a.dataSaida ?? ''));
  });

  /** Animal escolhido na tabela; `passagens` é null enquanto carrega. */
  protected readonly animalFiltro = signal<{ nome: string; passagens: Internacao[] | null } | null>(null);

  protected readonly dialogo = signal<EstadoDialogo | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroDialogo = signal<string | null>(null);
  protected readonly animais = signal<Animal[] | null>(null);
  protected readonly eventos = signal<InternacaoEvento[] | null>(null);

  constructor() {
    // Só no navegador: no SSR não há token (localStorage) nem proxy para /api.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.recarregar();
      const timer = setInterval(() => this.carregarInternacoes(), INTERVALO_ATUALIZACAO_MS);
      inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }
  }

  protected recarregar(): void {
    this.erroLista.set(null);
    this.baiaService.carregar().subscribe({ error: (e: HttpErrorResponse) => this.falhaNaLista(e) });
    this.carregarInternacoes();
  }

  protected mudarAba(aba: Aba): void {
    this.aba.set(aba);
    this.animalFiltro.set(null);
  }

  protected buscar(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }

  /** Todas as passagens do animal pela clínica, abertas e encerradas (GET /api/internacoes?animalId=). */
  protected verAnimal(internacao: Internacao): void {
    this.animalFiltro.set({ nome: internacao.animalNome, passagens: null });
    this.internacaoService.doAnimal(internacao.animalId).subscribe({
      next: (passagens) => this.animalFiltro.set({ nome: internacao.animalNome, passagens }),
      error: (e: HttpErrorResponse) => {
        this.animalFiltro.set(null);
        this.falhaNaLista(e);
      },
    });
  }

  protected limparAnimal(): void {
    this.animalFiltro.set(null);
  }

  protected acoes(internacao: Internacao): Acao[] {
    return acoesPara(internacao.status, this.role());
  }

  protected novaInternacao(): void {
    this.abrir({ tipo: 'admissao' });
    this.animais.set(null);
    this.internacaoService.animais().subscribe({
      next: (lista) => this.animais.set([...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))),
      error: (e: HttpErrorResponse) => {
        this.animais.set([]);
        if (!this.sessaoExpirou(e)) this.erroDialogo.set(this.internacaoService.mensagemDeErro(e));
      },
    });
  }

  protected abrirAcao(internacao: Internacao, acao: Acao): void {
    this.abrir({ tipo: 'acao', internacao, acao });
  }

  protected abrirHistorico(internacao: Internacao): void {
    this.abrir({ tipo: 'historico', internacao });
    this.eventos.set(null);
    this.internacaoService.eventos(internacao.id).subscribe({
      next: (lista) => this.eventos.set(lista),
      error: (e: HttpErrorResponse) => {
        if (!this.sessaoExpirou(e)) this.erroDialogo.set(this.internacaoService.mensagemDeErro(e));
      },
    });
  }

  protected fecharDialogo(): void {
    this.dialogo.set(null);
  }

  protected admitir(dados: DadosAdmissao): void {
    this.executar(this.internacaoService.admitir(dados));
  }

  protected confirmarAcao(corpo: object | null): void {
    const estado = this.dialogo();
    if (estado?.tipo === 'acao') {
      this.executar(this.internacaoService.executar(estado.internacao.id, estado.acao, corpo));
    }
  }

  private carregarInternacoes(): void {
    this.internacaoService.carregar().subscribe({ error: (e: HttpErrorResponse) => this.falhaNaLista(e) });
  }

  private abrir(estado: EstadoDialogo): void {
    this.erroDialogo.set(null);
    this.salvando.set(false);
    this.dialogo.set(estado);
  }

  /** Roda uma escrita na API: fecha o diálogo no sucesso, mostra o erro na falha. */
  private executar(chamada: ReturnType<InternacaoService['admitir']>): void {
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
        this.erroDialogo.set(this.internacaoService.mensagemDeErro(e));
        // 409: alguém mexeu nos mesmos dados ao mesmo tempo; o que está na tela ficou velho.
        if (e.status === 409) this.carregarInternacoes();
      },
    });
  }

  private falhaNaLista(e: HttpErrorResponse): void {
    if (this.sessaoExpirou(e)) return;
    this.erroLista.set(this.internacaoService.mensagemDeErro(e));
  }

  /** 401 = token ausente/expirado: limpa a sessão e volta para o login. */
  private sessaoExpirou(e: HttpErrorResponse): boolean {
    if (e.status !== 401) return false;
    this.auth.logout();
    this.router.navigateByUrl('/login');
    return true;
  }

  /** RN-01: vale o menor entre a capacidade cadastrada e o máximo do tipo (mesma conta do back). */
  private capacidade(baia: Baia): number {
    return Math.min(baia.capacidade, CAPACIDADE_MAXIMA[baia.tipo]);
  }

  private bloco(baia: Baia, internacoes: Internacao[]): BlocoBaia {
    const detalhe = NOME_POR_TIPO[baia.tipo] + (baia.ativo ? '' : ' · inativa');
    return { id: baia.id, titulo: baia.nome, detalhe, capacidade: this.capacidade(baia), internacoes };
  }
}
