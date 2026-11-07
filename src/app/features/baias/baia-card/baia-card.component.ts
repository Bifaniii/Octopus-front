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
  /** Animais internados nesta baia agora; `null` quando a ocupação não pôde ser carregada (a linha some). */
  @Input() ocupantes: string[] | null = null;
  @Output() selecionar = new EventEmitter<Baia>();

  /** Ex.: "Ocupada · Thor", "2 de 6 · Nina, Bidu" ou "Livre". */
  protected get ocupacao(): string {
    const nomes = this.ocupantes ?? [];
    if (nomes.length === 0) return 'Livre';
    const quantos = this.baia.capacidade > 1 ? `${nomes.length} de ${this.baia.capacidade}` : 'Ocupada';
    return `${quantos} · ${nomes.join(', ')}`;
  }

  /** Ex.: "Coletiva · até 6 animais" */
  protected get rodape(): string {
    const animais = this.baia.capacidade === 1 ? 'animal' : 'animais';
    return `${NOME_POR_TIPO[this.baia.tipo]} · até ${this.baia.capacidade} ${animais}`;
  }
}
