import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ModoDarkComponent } from '../modo-dark/modo-dark.component';

/** Item de navegação da sidebar. */
export type ItemNavegacao =
  | 'baias'
  | 'internacao'
  | 'painel-doses'
  | 'prontuarios'
  | 'relatorios'
  | 'medicamentos'
  | 'usuarios'
  | 'tutores';

const NOME_DO_PERFIL: Record<string, string> = {
  ROLE_ADMIN: 'Administrador',
  ROLE_VETERINARIO: 'Veterinário',
  ROLE_AUXILIAR: 'Auxiliar',
  ROLE_RECEPCIONISTA: 'Recepcionista',
};

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

  /** Mesmos perfis da rota `cadastro-tutor-animal`: quem não acessa nem vê o link. */
  protected readonly veTutores = computed(() =>
    this.auth.temRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_VETERINARIO']),
  );

  protected readonly email = computed(() => this.auth.usuario()?.email ?? '');

  protected readonly perfil = computed(() => NOME_DO_PERFIL[this.auth.usuario()?.role ?? ''] ?? '');

  protected fazerLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}