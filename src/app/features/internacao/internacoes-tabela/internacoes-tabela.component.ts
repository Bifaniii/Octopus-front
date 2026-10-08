import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Internacao, NOME_POR_STATUS, formatarDataHora } from '../internacao.model';

/**
 * InternacoesTabelaComponent
 * --------------------------
 * Tabela de internações (as encerradas ou as passagens de um animal). Só exibe e avisa: emite `historico`
 * para abrir a linha do tempo e `animal` para ver todas as passagens daquele animal. Não conhece serviços.
 */
@Component({
  selector: 'app-internacoes-tabela',
  standalone: true,
  templateUrl: './internacoes-tabela.component.html',
  styleUrl: './internacoes-tabela.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternacoesTabelaComponent {
  @Input({ required: true }) internacoes!: Internacao[];
  /** baiaId → nome. */
  @Input() nomesBaias: Record<string, string | undefined> = {};
  /** false quando a tabela já é a de um animal só (o link para ele não faz sentido). */
  @Input() linkAnimal = true;

  @Output() historico = new EventEmitter<Internacao>();
  @Output() animal = new EventEmitter<Internacao>();

  protected readonly formatar = formatarDataHora;

  /**
   * Como a internação terminou. A encerrada não guarda qual alta teve, mas só a alta a pedido do tutor exige
   * o termo, então ele identifica o caso.
   */
  protected desfecho(i: Internacao): string {
    if (i.status !== 'ENCERRADA') return NOME_POR_STATUS[i.status] + ' (em andamento)';
    return i.termoResponsabilidade ? 'Alta a pedido do tutor' : 'Alta autorizada';
  }
}
