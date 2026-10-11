import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Tutor, formatarCpf, formatarTelefone } from '../tutor.model';

/**
 * TutoresTabelaComponent
 * ----------------------
 * Tabela de tutores cadastrados. Só exibe: não conhece serviços e não emite eventos.
 */
@Component({
  selector: 'app-tutores-tabela',
  standalone: true,
  templateUrl: './tutores-tabela.component.html',
  styleUrl: './tutores-tabela.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutoresTabelaComponent {
  @Input({ required: true }) tutores!: Tutor[];

  protected readonly cpf = formatarCpf;
  protected readonly telefone = formatarTelefone;
}
