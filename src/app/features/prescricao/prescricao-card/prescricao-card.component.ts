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
  @Input() nomesDosMedicamentos: Partial<Record<number, string>> = {};
  @Input() podeDesativar = false;
  @Output() desativar = new EventEmitter<number>();
  @Input() podeAtivar = false;
  @Input() podeBaixar = false;
  @Input() baixando = false;
  @Output() baixar = new EventEmitter<number>();
  @Output() ativar = new EventEmitter<number>();

  get nomeDoStatus(): string {
    return NOME_DO_STATUS[this.status] ?? '';
  }

  nomeDe(medicacaoId: number): string {
    return this.nomesDosMedicamentos[medicacaoId] ?? `Medicamento #${medicacaoId}`;
  }
}
