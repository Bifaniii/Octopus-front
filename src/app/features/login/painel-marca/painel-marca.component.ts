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
  @Input() title = 'Cuidado veterinário, organizado com carinho.';
  @Input() subtitle =
    'Prontuários, agenda e histórico de cada paciente em um só lugar para sua equipe.';
}
