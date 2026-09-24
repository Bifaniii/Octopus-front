import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Baia, NOME_POR_TIPO } from '../baia.model';

/**
 * BaiaCardComponent
 * -----------------
 * Card de uma baia. Só exibe e avisa o clique: recebe a baia por @Input,
 * emite `selecionar` e não conhece serviços.
 */
@Component({
  selector: 'app-baia-card',
  standalone: true,
  templateUrl: './baia-card.component.html',
  styleUrl: './baia-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaiaCardComponent {
  @Input({ required: true }) baia!: Baia;
  /** Quando false (usuário sem permissão de escrita), o card não é clicável. */
  @Input() editavel = false;
  @Output() selecionar = new EventEmitter<Baia>();

  /** Ex.: "Coletiva · até 6 animais" */
  protected get rodape(): string {
    const animais = this.baia.capacidade === 1 ? 'animal' : 'animais';
    return `${NOME_POR_TIPO[this.baia.tipo]} · até ${this.baia.capacidade} ${animais}`;
  }
}
