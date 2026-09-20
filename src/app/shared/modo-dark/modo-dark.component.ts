import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TemaService } from '../../core/services/tema.service';

/**
 * ModoDarkComponent
 * -----------------
 * Botão que liga/desliga o modo escuro. Não tem regra de negócio:
 * só chama `TemaService.toggleTheme()` e mostra o ícone/texto do
 * tema atual. Vive em `shared/` para ser usado em qualquer tela.
 *
 * Uso: <app-modo-dark />
 */
@Component({
  selector: 'app-modo-dark',
  standalone: true,
  templateUrl: './modo-dark.component.html',
  styleUrl: './modo-dark.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModoDarkComponent {
  protected readonly tema = inject(TemaService);

  protected onToggle(): void {
    this.tema.toggleTheme();
  }
}
