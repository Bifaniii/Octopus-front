import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ACOES, Acao, Internacao, NOME_POR_STATUS, formatarDataHora } from '../internacao.model';

/**
 * InternacaoCardComponent
 * -----------------------
 * Card de um animal internado. Só exibe e avisa: recebe a internação e as ações que o usuário pode fazer
 * nela (calculadas pela página), emite `acao` e `historico` e não conhece serviços.
 */
@Component({
  selector: 'app-internacao-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './internacao-card.component.html',
  styleUrl: './internacao-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternacaoCardComponent {
  @Input({ required: true }) internacao!: Internacao;
  @Input() acoes: Acao[] = [];
  /** Só o veterinário prescreve: para ele, o aviso de prescrição pendente traz o atalho para a tela. */
  @Input() podePrescrever = false;
  @Output() acao = new EventEmitter<Acao>();
  @Output() historico = new EventEmitter<void>();
  /** Depois da alta, quem atende abre o resumo que vai (ou foi) ao tutor. */
  @Input() podeResumo = false;
  @Output() resumo = new EventEmitter<void>();

  protected get temAlta(): boolean {
    return this.internacao.status === 'ALTA_AUTORIZADA' || this.internacao.status === 'ALTA_A_PEDIDO_DO_TUTOR';
  }

  protected readonly definicoes = ACOES;
  protected readonly nomes = NOME_POR_STATUS;
  protected readonly formatar = formatarDataHora;

  /** Classe de cor do card, uma por status (ex.: card--em_tratamento). */
  protected get classeStatus(): string {
    return 'card--' + this.internacao.status.toLowerCase();
  }
}
