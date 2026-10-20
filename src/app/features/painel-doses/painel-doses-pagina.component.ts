import { DatePipe, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { AplicacaoDialogoComponent } from './aplicacao-dialogo/aplicacao-dialogo.component';
import { AlvoAplicacao, Dose, ItemSeNecessario, NOME_DO_ESQUEMA, Painel } from './painel-doses.model';
import { InternacaoDoPainel, PainelDosesService } from './painel-doses.service';

const INTERVALO_ATUALIZACAO_MS = 60_000;

// Tela 6: o que está atrasado, o que vence na próxima hora e o que foi perdido, com o registro da aplicação.
// Quem decide atrasada, perdida e reaplicação é o octopus-msdoses; a tela só agrupa e mostra.
@Component({
  selector: 'app-painel-doses-pagina',
  standalone: true,
  imports: [AppShellComponent, AplicacaoDialogoComponent, DatePipe],
  templateUrl: './painel-doses-pagina.component.html',
  styleUrl: './painel-doses-pagina.component.css',
})
export class PainelDosesPaginaComponent {
  private readonly service = inject(PainelDosesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly painel = signal<Painel | null>(null);
  private readonly internacoes = signal(new Map<number, InternacaoDoPainel>());
  private readonly baias = signal(new Map<number, string>());
  private readonly medicamentos = signal(new Map<number, string>());

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly alvo = signal<AlvoAplicacao | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroDialogo = signal<string | null>(null);

  protected readonly nomeDoEsquema = NOME_DO_ESQUEMA;

  // O enunciado: o auxiliar registra a aplicação. Os outros perfis acompanham o painel.
  protected readonly podeAplicar = computed(() => this.auth.temRole(['ROLE_AUXILIAR']));

  // Só animais ainda internados: a dose perdida de quem já saiu fica no relatório, não no plantão.
  private readonly aberta = (d: { internacaoId: number }) =>
    this.internacoes().get(d.internacaoId)?.status !== 'ENCERRADA';

  protected readonly atrasadas = computed(() => (this.painel()?.atrasadas ?? []).filter(this.aberta));
  protected readonly proximas = computed(() => (this.painel()?.proximas ?? []).filter(this.aberta));
  protected readonly perdidas = computed(() => (this.painel()?.perdidas ?? []).filter(this.aberta));
  protected readonly seNecessario = computed(() => (this.painel()?.seNecessario ?? []).filter(this.aberta));

  constructor() {
    // Só no navegador: no SSR não há token nem proxy para /api.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.carregar();
      const timer = setInterval(() => this.carregar(), INTERVALO_ATUALIZACAO_MS);
      inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }
  }

  protected carregar(): void {
    this.carregando.set(true);
    // Sem internação, baia ou medicamento o painel ainda aparece, com os ids no lugar dos nomes.
    forkJoin({
      painel: this.service.painel(),
      internacoes: this.service.internacoes().pipe(catchError(() => of([] as InternacaoDoPainel[]))),
      baias: this.service.nomesDasBaias().pipe(catchError(() => of(new Map<number, string>()))),
      medicamentos: this.service.nomesDosMedicamentos().pipe(catchError(() => of(new Map<number, string>()))),
    }).subscribe({
      next: ({ painel, internacoes, baias, medicamentos }) => {
        this.painel.set(painel);
        this.internacoes.set(new Map(internacoes.map((i) => [i.id, i] as const)));
        this.baias.set(baias);
        this.medicamentos.set(medicamentos);
        this.erro.set(null);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.tratarErro(e, this.erro);
      },
    });
  }

  protected animal(internacaoId: number): string {
    return this.internacoes().get(internacaoId)?.animalNome ?? `Internação #${internacaoId}`;
  }

  protected baia(internacaoId: number): string | null {
    const internacao = this.internacoes().get(internacaoId);
    return internacao ? this.baias().get(internacao.baiaId) ?? null : null;
  }

  protected medicamento(medicacaoId: number): string {
    return this.medicamentos().get(medicacaoId) ?? `Medicamento #${medicacaoId}`;
  }

  /** A janela da dose que vence na próxima hora pode ainda não ter aberto (RN-03). */
  protected janelaAberta(dose: Dose): boolean {
    const agora = this.painel()?.agora;
    return !!agora && !!dose.janelaInicio && dose.janelaInicio <= agora;
  }

  protected abrirDose(dose: Dose): void {
    this.abrir({
      tipo: 'dose',
      id: dose.id,
      animal: this.animal(dose.internacaoId),
      medicamento: this.medicamento(dose.medicacaoId),
      detalhe: `Dose prevista para ${this.hora(dose.horarioPrevisto)}`,
    });
  }

  protected abrirSeNecessario(item: ItemSeNecessario): void {
    this.abrir({
      tipo: 'se-necessario',
      id: item.itemPrescricaoId,
      animal: this.animal(item.internacaoId),
      medicamento: this.medicamento(item.medicacaoId),
      detalhe: `Se necessário, intervalo mínimo de ${item.intervaloMinimoHoras} h`,
    });
  }

  /** Leva até a seção; usado pelo resumo no topo. */
  protected irPara(secao: string): void {
    document.getElementById(`secao-${secao}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected fecharDialogo(): void {
    this.alvo.set(null);
  }

  protected confirmar(observacao: string | undefined): void {
    const alvo = this.alvo();
    if (!alvo) return;
    this.salvando.set(true);
    this.erroDialogo.set(null);
    const pedido =
      alvo.tipo === 'dose'
        ? this.service.aplicar(alvo.id, observacao)
        : this.service.aplicarSeNecessario(alvo.id, observacao);
    pedido.subscribe({
      next: () => {
        this.salvando.set(false);
        this.alvo.set(null);
        this.carregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.tratarErro(e, this.erroDialogo);
        if (e.status === 409 || e.status === 422) this.carregar();
      },
    });
  }

  private abrir(alvo: AlvoAplicacao): void {
    this.erroDialogo.set(null);
    this.alvo.set(alvo);
  }

  private hora(valor: string): string {
    return `${valor.slice(8, 10)}/${valor.slice(5, 7)} ${valor.slice(11, 16)}`;
  }

  private tratarErro(e: HttpErrorResponse, destino: { set(v: string | null): void }): void {
    if (e.status === 401) {
      this.auth.logout();
      this.router.navigate(['/login']);
      return;
    }
    destino.set(this.service.mensagemDeErro(e));
  }
}
