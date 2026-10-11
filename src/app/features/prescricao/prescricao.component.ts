import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { PrescricaoCardComponent } from './prescricao-card/prescricao-card.component';
import { PrescricaoDialogoComponent } from './prescricao-dialogo/prescricao-dialogo.component';
import {
  InternacaoOpcao,
  MedicacaoOpcao,
  Prescricao,
  PrescricaoRequest,
  STATUS_QUE_ACEITAM_PRESCRICAO,
} from './prescricao.model';
import { PrescricaoService } from './prescricao.service';

// Container da rota /prescricoes: o único que injeta services e controla o modal.
@Component({
  selector: 'app-prescricao',
  standalone: true,
  imports: [
    AppShellComponent,
    PrescricaoCardComponent,
    PrescricaoDialogoComponent,
  ],
  templateUrl: './prescricao.component.html',
  styleUrl: './prescricao.component.css',
})
export class PrescricaoComponent implements OnInit {
  private readonly service = inject(PrescricaoService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly noNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly prescricoes = signal<Prescricao[]>([]);
  readonly internacoes = signal<InternacaoOpcao[]>([]);
  readonly medicacoes = signal<MedicacaoOpcao[]>([]);

  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly modalAberto = signal(false);
  readonly salvando = signal(false);
  readonly erroDoModal = signal<string | null>(null);

  // O GET devolve ativas e inativas; a tela mostra só as ativas.
  readonly ativas = computed(() => this.prescricoes().filter((p) => p.ativo));

  readonly internacoesElegiveis = computed(() =>
    this.internacoes().filter((i) =>
      STATUS_QUE_ACEITAM_PRESCRICAO.includes(i.status),
    ),
  );

  private readonly internacaoPorId = computed(
    () => new Map(this.internacoes().map((i) => [i.id, i] as const)),
  );

  readonly nomesDosMedicamentos = computed(() =>
    Object.fromEntries(
      this.medicacoes().map((m) => [m.id, m.nomeComercial]),
    ),
  );

  // O back só deixa o VETERINARIO prescrever e desativar (o admin levaria 403).
  get podePrescrever(): boolean {
    return this.auth.temRole(['ROLE_VETERINARIO']);
  }

  ngOnInit(): void {
    // No SSR não há token nem proxy: só carrega no navegador.
    if (this.noNavegador) this.carregar();
  }

  animalDe(internacaoId: number): string {
    return this.internacaoPorId().get(internacaoId)?.animalNome ?? '';
  }

  especieDe(internacaoId: number): string {
    return this.internacaoPorId().get(internacaoId)?.animalEspecie ?? '';
  }

  statusDe(internacaoId: number): string {
    return this.internacaoPorId().get(internacaoId)?.status ?? '';
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    // Se internação ou medicamentos estiverem fora do ar, a lista de prescrições ainda aparece.
    forkJoin({
      prescricoes: this.service.listar(),
      internacoes: this.service
        .listarInternacoes()
        .pipe(catchError(() => of([] as InternacaoOpcao[]))),
      medicacoes: this.service
        .listarMedicacoes()
        .pipe(catchError(() => of([] as MedicacaoOpcao[]))),
    }).subscribe({
      next: ({ prescricoes, internacoes, medicacoes }) => {
        this.prescricoes.set(prescricoes);
        this.internacoes.set(internacoes);
        this.medicacoes.set(medicacoes);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.tratarErro(e, this.erro);
      },
    });
  }

  abrirModal(): void {
    this.erroDoModal.set(null);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
  }

  salvar(pedido: PrescricaoRequest): void {
    this.salvando.set(true);
    this.erroDoModal.set(null);
    this.service.criar(pedido).subscribe({
      next: () => {
        this.salvando.set(false);
        this.modalAberto.set(false);
        this.carregar(); // a internação passou para "em tratamento": recarrega para refletir
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.tratarErro(e, this.erroDoModal); // o modal continua aberto, com a mensagem do back
      },
    });
  }

  desativar(id: number): void {
    if (!confirm('Desativar esta prescrição?')) return;
    this.service.desativar(id).subscribe({
      next: (atualizada) =>
        this.prescricoes.update((lista) =>
          lista.map((p) => (p.id === atualizada.id ? atualizada : p)),
        ),
      error: (e: HttpErrorResponse) => this.tratarErro(e, this.erro),
    });
  }

  private tratarErro(
    e: HttpErrorResponse,
    destino: { set(v: string | null): void },
  ): void {
    if (e.status === 401) {
      this.auth.logout();
      this.router.navigate(['/login']);
      return;
    }
    destino.set(this.service.mensagemDeErro(e));
  }
}
