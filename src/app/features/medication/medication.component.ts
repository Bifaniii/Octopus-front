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
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { MedicacaoDialogoComponent } from './medicacao-dialogo/medicacao-dialogo.component';
import { MedicacaoService } from './medicacao.service';
import { DadosMedicacao, Medicacao, NOME_POR_ESQUEMA } from './medicacao.model';

/** Situação da validade, controla a cor da etiqueta — ver CSS. */
type SituacaoValidade = 'ok' | 'proxima' | 'vencido';

/** Medicamento já com os textos prontos para o template. */
interface MedicacaoExibida extends Medicacao {
  esquema: string;
  vencimento: string;
  validade: SituacaoValidade;
}

/** A partir de quantos dias antes do vencimento a etiqueta fica em alerta. */
const DIAS_ALERTA_VENCIMENTO = 30;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * MedicationComponent
 * -------------------
 * Tela de CONSULTA do catálogo de medicamentos da clínica (tela 3 do TAP),
 * alimentada pelo microserviço octopus-msmedications. Só exibe: nome,
 * princípio ativo, apresentação, esquema, validade, fabricante, registro
 * ANVISA e interações proibidas.
 *
 * Doses aplicadas nos animais NÃO são desta tela: elas virão da prescrição
 * e do painel de doses (Sprints 3 e 4).
 */
@Component({
  selector: 'app-medication',
  standalone: true,
  imports: [AppShellComponent, MedicacaoDialogoComponent],
  templateUrl: './medication.component.html',
  styleUrl: './medication.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationComponent {
  private readonly medicacaoService = inject(MedicacaoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly dataHoje = this.formatarDataExtenso(new Date());

  private readonly medicacoes = signal<MedicacaoExibida[]>([]);
  protected readonly catalogo = this.medicacoes.asReadonly();
  protected readonly dialogoAberto = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erroDialogo = signal<string | null>(null);
  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly podeCadastrar = computed(() => this.auth.temRole(['ROLE_ADMIN', 'ROLE_VETERINARIO']));
  protected readonly busca = signal('');
  protected readonly mostrarInativos = signal(false);

  protected readonly totalAtivos = computed(() => this.medicacoes().filter((m) => m.ativo).length);

  /** Filtra por nome comercial, princípio ativo ou fabricante. */
  protected readonly filtradas = computed(() => {
    const termo = this.normalizar(this.busca());
    const inativos = this.mostrarInativos();
    return this.medicacoes().filter(
      (m) =>
        (inativos || m.ativo) &&
        (!termo ||
          [m.nomeComercial, m.principioAtivo, m.fabricante].some((t) => this.normalizar(t).includes(termo))),
    );
  });

  constructor() {
    // Só no navegador: no SSR não há token (localStorage) nem proxy para /api.
    afterNextRender(() => this.recarregar());
  }

  protected recarregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.medicacaoService.listar().subscribe({
      next: (lista) => {
        this.carregando.set(false);
        this.medicacoes.set(
          lista
            .map((m) => this.paraExibicao(m))
            .sort((a, b) => a.nomeComercial.localeCompare(b.nomeComercial, 'pt-BR')),
        );
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        if (e.status === 401) {
          // Token ausente/expirado: limpa a sessão e volta para o login.
          this.auth.logout();
          this.router.navigateByUrl('/login');
          return;
        }
        this.erro.set(
          e.status === 0
            ? 'Não foi possível conectar ao servidor de medicamentos. Verifique se a API está no ar.'
            : 'Não foi possível carregar os medicamentos. Tente novamente.',
        );
      },
    });
  }

  protected novoMedicamento(): void {
    this.erroDialogo.set(null);
    this.salvando.set(false);
    this.dialogoAberto.set(true);
  }

  protected fecharDialogo(): void {
    this.dialogoAberto.set(false);
  }

  protected salvar(dados: DadosMedicacao): void {
    this.salvando.set(true);
    this.erroDialogo.set(null);
    this.medicacaoService.criar(dados).subscribe({
      next: () => {
        this.salvando.set(false);
        this.dialogoAberto.set(false);
        // Recarrega tudo: as interações são gravadas nos dois sentidos, então os outros cards também mudam.
        this.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        if (e.status === 401) {
          this.auth.logout();
          this.router.navigateByUrl('/login');
          return;
        }
        this.erroDialogo.set(this.medicacaoService.mensagemDeErro(e));
      },
    });
  }

  protected aoBuscar(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }

  protected aoAlternarInativos(evento: Event): void {
    this.mostrarInativos.set((evento.target as HTMLInputElement).checked);
  }

  private paraExibicao(m: Medicacao): MedicacaoExibida {
    // LocalDateTime vem sem fuso ("2027-03-01T00:00:00"): o Date interpreta como horário local.
    const vencimento = new Date(m.dataVencimento);
    const diasRestantes = (vencimento.getTime() - Date.now()) / UM_DIA_MS;
    return {
      ...m,
      esquema: NOME_POR_ESQUEMA[m.tipoEsquema],
      vencimento: new Intl.DateTimeFormat('pt-BR').format(vencimento),
      validade: diasRestantes < 0 ? 'vencido' : diasRestantes <= DIAS_ALERTA_VENCIMENTO ? 'proxima' : 'ok',
    };
  }

  private normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  private formatarDataExtenso(data: Date): string {
    const texto = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(data);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
