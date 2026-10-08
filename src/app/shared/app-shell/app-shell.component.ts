
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal, // <-- 1. Importe o signal aqui
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
  | 'usuarios';

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

  // 2. Criado um Signal para controlar o estado do menu (funciona perfeitamente com OnPush)
  protected readonly menuAberto = signal(false);

  protected readonly iniciais = computed(() => {
    const email = this.auth.usuario()?.email ?? '';
    const nome = email.split('@')[0] ?? '';
    return nome.slice(0, 2).toUpperCase() || '?';
  });

  // 3. Função para alternar o estado do menu
  protected toggleMenu(): void {
    this.menuAberto.update(estado => !estado);
  }

  // 4. Função para redirecionar para a rota de logout externa
  protected fazerLogout(): void {
    this.auth.logout();
    this.menuAberto.set(false);
    this.router.navigate(['/login']);
  }
}

