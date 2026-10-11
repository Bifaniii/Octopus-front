import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { antirrabicaVencida } from '../../../internacao/internacao.model';
import { Animal } from '../../animais/animal.model';
import { Tutor, formatarData, formatarTelefone } from '../tutor.model';

export interface AnimalDoTutor {
  tutor: Tutor;
  animal: Animal;
}

/**
 * TutoresTabelaComponent
 * ----------------------
 * Tutores com os seus animais. Só exibe e emite eventos; quem chama a API é o container.
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
  /** Nome de cada animal por id, para mostrar a mãe. */
  @Input() nomesAnimais: Partial<Record<number, string>> = {};
  @Input() podeEditar = false;

  @Output() editarTutor = new EventEmitter<Tutor>();
  @Output() adicionarAnimal = new EventEmitter<Tutor>();
  @Output() editarAnimal = new EventEmitter<AnimalDoTutor>();

  protected readonly telefone = formatarTelefone;
  protected readonly data = formatarData;
  /** RN-02, mesma conta do back: sem registro ou há mais de 12 meses. */
  protected readonly vencida = antirrabicaVencida;
}
