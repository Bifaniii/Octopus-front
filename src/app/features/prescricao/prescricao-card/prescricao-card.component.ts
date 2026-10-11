import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NOME_DO_STATUS, Prescricao } from '../prescricao.model';

// Componente visual: só recebe dados por @Input e emite ações por @Output.
@Component({
  selector: 'app-prescricao-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './prescricao-card.component.html',
  styleUrl: './prescricao-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescricaoCardComponent {
  @Input({ required: true }) prescricao!: Prescricao;
  @Input() animalNome = '';
  @Input() animalEspecie = '';
  @Input() status = '';
  @Input() nomesDosMedicamentos: Record<string, string> = {};
  @Input() podeDesativar = false;
  @Output() desativar = new EventEmitter<number>();

  get nomeDoStatus(): string {
    return NOME_DO_STATUS[this.status] ?? '';
  }

  nomeDe(medicacaoId: string | number): string {
    return (
      this.nomesDosMedicamentos[String(medicacaoId)] ??
      `Medicamento #${medicacaoId}`
    );
  }
}
