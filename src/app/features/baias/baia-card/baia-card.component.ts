import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Baia, ROTULO_POR_TIPO } from '../baia.model';

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
  @Output() selecionar = new EventEmitter<Baia>();

  protected get titulo(): string {
    const numero = String(this.baia.numero).padStart(2, '0');
    return `${ROTULO_POR_TIPO[this.baia.tipo]} ${numero}`;
  }

  protected get ocupada(): boolean {
    return this.baia.status === 'ocupada';
  }

  /** Ex.: "Dra. Ana · desde 14:20" */
  protected get rodape(): string {
    const partes = [this.baia.detalhe, this.baia.desde ? `desde ${this.baia.desde}` : ''];
    return partes.filter(Boolean).join(' · ');
  }
}
