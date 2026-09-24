import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ModoDarkComponent } from '../modo-dark/modo-dark.component';

/** Item de navegação da sidebar. */
export type ItemNavegacao =
  | 'baias'
  | 'internacao'
  | 'prontuarios'
  | 'relat-dose'
  | 'medicamentos';

/**
 * AppShellComponent
 * ------------------
 * Casca visual (sidebar + cabeçalho) usada por todas as telas da área logada.
 * Puramente de APRESENTAÇÃO: recebe título/subtítulo via @Input e
 * projeta o conteúdo da tela via <ng-content>.
 *
 * NOTA (squad baias): adicionamos o item "baias" na sidebar, com link real
 * para /baias. Os demais itens continuam placeholders visuais até suas
 * telas existirem.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, ModoDarkComponent],
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
