import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { PainelMarcaComponent } from './painel-marca/painel-marca.component';
import { LoginFormularioComponent, Credenciais } from './login-formulario/login-formulario.component';
import { ModoDarkComponent } from '../../shared/modo-dark/modo-dark.component';
import { AuthService } from '../../core/services/auth.service';

/**
 * LoginPaginaComponent
 * --------------------
 * Componente de ROTA (container) da tela de login. Monta os três
 * blocos visuais e é o único ponto que conhece o AuthService:
 * chama a API, controla os estados (`carregando`, `erro`) e, no
 * sucesso, redireciona para a área logada.
 */
@Component({
  selector: 'app-login-pagina',
  standalone: true,
  imports: [PainelMarcaComponent, LoginFormularioComponent, ModoDarkComponent],
  templateUrl: './login-pagina.component.html',
  styleUrl: './login-pagina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPaginaComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected handleLogin(credenciais: Credenciais): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.auth.login(credenciais).subscribe({
      next: () => {
        this.carregando.set(false);
        // TODO: quando a área logada existir, redirecione para ela.
        // Ex.: this.router.navigateByUrl('/painel');
        this.router.navigateByUrl('/login');
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(this.mensagemDeErro(e));
      },
    });
  }

  private mensagemDeErro(e: HttpErrorResponse): string {
    if (e.status === 401 || e.status === 403) {
      return 'E-mail ou senha inválidos.';
    }
    if (e.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique se a API está no ar.';
    }
    return 'Algo deu errado ao entrar. Tente novamente.';
  }
}
