import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { BaiaCardComponent } from './baia-card/baia-card.component';
import { BaiaDialogoComponent } from './baia-dialogo/baia-dialogo.component';
import { BaiaService } from './baia.service';
import { Baia, DadosBaia, TipoBaia } from './baia.model';

const SECOES: { tipo: TipoBaia; titulo: string }[] = [
  { tipo: 'padrao', titulo: 'Baias' },
  { tipo: 'ninhada', titulo: 'Baia de Ninhada' },
  { tipo: 'coletiva', titulo: 'Baia Coletiva' },
];

/** Atalho de serviço mostrado no topo da tela. O ícone é uma classe do bootstrap-icons. */
interface Servico {
  nome: string;
  icone: string;
}

/**
 * CadastroBaiasPaginaComponent
 * ----------------------------
 * Componente de ROTA do painel de baias. Busca os dados no BaiaService,
 * agrupa por tipo, monta os cards e controla o diálogo de cadastro/edição.
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

  protected readonly baias = this.baiaService.baias;
  protected readonly dataHoje = this.formatarData(new Date());

  /** `null` = diálogo fechado. `{ baia: null }` = nova baia. `{ baia }` = edição. */
  protected readonly dialogo = signal<{ baia: Baia | null } | null>(null);

  protected readonly servicos: Servico[] = [
    { nome: 'Agendamento', icone: 'bi-calendar-check' },
    { nome: 'Prontuários', icone: 'bi-clipboard2-check' },
    { nome: 'Estoque', icone: 'bi-box-seam' },
  ];

  protected readonly grupos = computed(() => {
    const todas = this.baias();
    return SECOES.map((s) => ({
      ...s,
      baias: todas.filter((b) => b.tipo === s.tipo).sort((a, b) => a.numero - b.numero),
    })).filter((g) => g.baias.length > 0);
  });

  protected novaBaia(): void {
    this.dialogo.set({ baia: null });
  }

  protected editarBaia(baia: Baia): void {
    this.dialogo.set({ baia });
  }

  protected fecharDialogo(): void {
    this.dialogo.set(null);
  }

  protected salvar(dados: DadosBaia): void {
    const atual = this.dialogo()?.baia;
    if (atual) {
      this.baiaService.atualizar(atual.id, dados);
    } else {
      this.baiaService.adicionar(dados);
    }
    this.dialogo.set(null);
  }

  protected remover(): void {
    const atual = this.dialogo()?.baia;
    if (atual) {
      this.baiaService.remover(atual.id);
    }
    this.dialogo.set(null);
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
