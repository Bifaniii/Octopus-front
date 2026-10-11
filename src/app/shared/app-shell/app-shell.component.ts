import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ModoDarkComponent } from '../modo-dark/modo-dark.component';

/** Item de navegação da sidebar. */
export type ItemNavegacao =
  | 'baias'
  | 'internacao'
  | 'prontuarios'
  | 'relat-dose'
  | 'medicamentos'
  | 'usuarios'
  | 'tutores'; // <-- ADICIONADO AQUI

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
  private readonly router = inject(Router);

  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() itemAtivo: ItemNavegacao = 'medicamentos';

  protected readonly menuAberto = signal(false);

  protected readonly iniciais = computed(() => {
    const email = this.auth.usuario()?.email ?? '';
    const nome = email.split('@')[0] ?? '';
    return nome.slice(0, 2).toUpperCase() || '?';
  });

  protected toggleMenu(): void {
    this.menuAberto.update(estado => !estado);
  }

  protected fazerLogout(): void {
    this.auth.logout();
    this.menuAberto.set(false);
    this.router.navigate(['/login']);
  }
}