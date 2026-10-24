import {
  ChangeDetectionStrategy,
  Component,
  Input,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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

const CHAVE_MENU_OCULTO = 'plantao.menu-oculto';

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

  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** Menu lateral escondido. Fica guardado no navegador para valer também nas outras telas. */
  protected readonly menuOculto = signal(this.lerMenuOculto());

  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() itemAtivo: ItemNavegacao = 'medicamentos';

  /** Mesmos perfis da rota `cadastro-tutor-animal`: quem não acessa nem vê o link. */
  protected readonly veTutores = computed(() =>
    this.auth.temRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_VETERINARIO']),
  );

  protected readonly email = computed(() => this.auth.usuario()?.email ?? '');

  protected readonly perfil = computed(() => NOME_DO_PERFIL[this.auth.usuario()?.role ?? ''] ?? '');

  protected alternarMenu(): void {
    this.menuOculto.update((oculto) => !oculto);
    if (!this.navegador) return;
    try {
      localStorage.setItem(CHAVE_MENU_OCULTO, this.menuOculto() ? '1' : '0');
    } catch {
      // sem armazenamento (janela privada): o menu só não lembra a escolha
    }
  }

  private lerMenuOculto(): boolean {
    if (!this.navegador) return false;
    try {
      return localStorage.getItem(CHAVE_MENU_OCULTO) === '1';
    } catch {
      return false;
    }
  }

  protected fazerLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}