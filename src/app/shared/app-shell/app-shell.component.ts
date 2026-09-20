import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ModoDarkComponent } from '../modo-dark/modo-dark.component';

/** Item de navegação da sidebar. */
export type ItemNavegacao =
  | 'internacao'
  | 'prontuarios'
  | 'relat-dose'
  | 'medicamentos';

/**
 * AppShellComponent
 * ------------------
 * Casca visual (sidebar + cabeçalho) usada por todas as telas da área logada.
 * Puramente de APRESENTAÇÃO: recebe título/subtítulo via @Input e
 * projeta o conteúdo da tela via <ng-content>. A navegação da
 * sidebar ainda é um placeholder visual — troque os `<button>` por
 * `routerLink` quando as telas de Agendamento/Prontuários.etc
 * Estoque existirem.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [ModoDarkComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);

  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() itemAtivo: ItemNavegacao = 'medicamentos';

  protected readonly iniciais = computed(() => {
    const email = this.auth.usuario()?.email ?? '';
    const nome = email.split('@')[0] ?? '';
    return nome.slice(0, 2).toUpperCase() || '?';
  });
}
