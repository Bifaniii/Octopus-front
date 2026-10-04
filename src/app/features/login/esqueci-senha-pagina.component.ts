import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PainelMarcaComponent } from './painel-marca/painel-marca.component';
import { ModoDarkComponent } from '../../shared/modo-dark/modo-dark.component';
import { AuthService } from '../../core/services/auth.service';

/**
 * EsqueciSenhaPaginaComponent
 * ---------------------------
 * Etapa 1 da recuperação de senha: o usuário informa o e-mail e a
 * tela chama POST /api/auth/esqueci-senha. O back-end SEMPRE responde
 * 204 (exista ou não o e-mail, para não revelar quem tem conta), então
 * a tela sempre mostra a mesma mensagem genérica de sucesso — nunca
 * "e-mail não encontrado".
 */
@Component({
  selector: 'app-esqueci-senha-pagina',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PainelMarcaComponent, ModoDarkComponent],
  templateUrl: './esqueci-senha-pagina.component.html',
  styleUrl: './esqueci-senha-pagina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EsqueciSenhaPaginaComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected enviar(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    this.auth.esqueciSenha(this.form.getRawValue().email).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviado.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(
          e.status === 0
            ? 'Não foi possível conectar ao servidor. Verifique se a API está no ar.'
            : 'Algo deu errado. Tente novamente.',
        );
      },
    });
  }
}
