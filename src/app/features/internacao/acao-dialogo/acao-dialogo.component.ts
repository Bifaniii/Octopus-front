import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Baia, CAPACIDADE_MAXIMA } from '../../baias/baia.model';
import { ACOES, Acao, Internacao, agoraLocal } from '../internacao.model';

/**
 * AcaoDialogoComponent
 * --------------------
 * Confirmação de uma transição do ciclo de vida. Pede o dado que cada uma exige no back:
 * a baia de isolamento (isolar), o termo (alta a pedido do tutor) ou a hora da saída física (encerrar, RN-08).
 * Emite `confirmar` com o corpo do PATCH (ou null) e não conhece serviços.
 */
@Component({
  selector: 'app-acao-dialogo',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './acao-dialogo.component.html',
  styleUrl: '../dialogo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcaoDialogoComponent implements OnInit, AfterViewInit {
  @Input({ required: true }) internacao!: Internacao;
  @Input({ required: true }) acao!: Acao;
  /** Baias ativas, para escolher a de isolamento. */
  @Input() baias: Baia[] = [];
  @Input() ocupacao: Record<string, number> = {};
  @Input() salvando = false;
  @Input() erroApi: string | null = null;

  @Output() confirmar = new EventEmitter<object | null>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  protected readonly definicoes = ACOES;
  protected readonly erro = signal<string | null>(null);

  protected baiaId = '';
  protected termo = '';
  protected dataSaida = '';

  ngOnInit(): void {
    this.dataSaida = agoraLocal();
    // Animal admitido já numa baia de isolamento (RN-02 na entrada) pode ficar nela.
    const atual = this.baias.find((b) => b.id === this.internacao.baiaId);
    if (atual?.tipo === 'ISOLAMENTO') {
      this.baiaId = atual.id;
    }
  }

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  /** Baias de isolamento com vaga (ou a própria baia do animal). */
  protected get isolamentos(): { baia: Baia; livre: boolean }[] {
    return this.baias
      .filter((b) => b.tipo === 'ISOLAMENTO')
      .map((baia) => {
        const capacidade = Math.min(baia.capacidade, CAPACIDADE_MAXIMA[baia.tipo]);
        const livre = baia.id === this.internacao.baiaId || (this.ocupacao[baia.id] ?? 0) < capacidade;
        return { baia, livre };
      });
  }

  protected fecharDialogo(): void {
    this.dialogo.nativeElement.close();
  }

  protected enviar(): void {
    if (this.salvando) return;
    switch (this.acao) {
      case 'isolar':
        if (!this.baiaId) return this.erro.set('Escolha a baia de isolamento.');
        return this.emitir({ baiaId: this.baiaId });
      case 'alta-a-pedido-do-tutor': {
        const termo = this.termo.trim();
        if (!termo) return this.erro.set('Registre o termo de responsabilidade assinado pelo tutor.');
        return this.emitir({ termoResponsabilidade: termo });
      }
      case 'encerrar':
        if (!this.dataSaida) return this.erro.set('Informe a data e a hora da saída.');
        // Valor do datetime-local, sem fuso ("2026-10-08T22:30"): é o LocalDateTime que o back espera.
        return this.emitir({ dataSaida: this.dataSaida });
      default:
        return this.emitir(null);
    }
  }

  private emitir(corpo: object | null): void {
    this.erro.set(null);
    this.confirmar.emit(corpo);
  }
}
