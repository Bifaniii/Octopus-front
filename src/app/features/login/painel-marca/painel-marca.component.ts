import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * PainelMarcaComponent
 * --------------------
 * Painel da esquerda das telas de acesso: marca, a frase do produto e a régua dos turnos do plantão.
 * É "burro" de propósito: só exibe conteúdo, sem lógica.
 */
@Component({
  selector: 'app-painel-marca',
  standalone: true,
  templateUrl: './painel-marca.component.html',
  styleUrl: './painel-marca.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelMarcaComponent {
  @Input() brandName = 'Plantão VidaPet';
  @Input() frase = 'O que está atrasado, o que vence na próxima hora e o que foi perdido, a qualquer hora do plantão.';

  /** Uma marca por hora, de 6h às 6h do dia seguinte. As horas rotuladas são as que abrem cada turno. */
  protected readonly horas = Array.from({ length: 25 }, (_, i) => (6 + i) % 24);
  protected readonly rotuladas = new Set([6, 12, 18]);
}
