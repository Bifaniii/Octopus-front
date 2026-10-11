import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * PainelMarcaComponent
 * --------------------
 * Painel azul da esquerda: logo, título e frase de apoio.
 * É "burro" de propósito — só exibe conteúdo, sem lógica.
 * Título e subtítulo são @Input para o painel poder ser
 * reaproveitado em outras telas (ex.: cadastro) trocando o texto.
 */
@Component({
  selector: 'app-painel-marca',
  standalone: true,
  templateUrl: './painel-marca.component.html',
  styleUrl: './painel-marca.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelMarcaComponent {
  @Input() brandName = 'VidaPet';
  @Input() title = 'Plantão da VidaPet';
  @Input() subtitle =
    'A qualquer hora do plantão, veja o que está atrasado, o que vence na próxima hora e o que foi perdido.';
}
