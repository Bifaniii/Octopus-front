import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PainelMarcaComponent } from './painel-marca/painel-marca.component';
import { ModoDarkComponent } from '../../shared/modo-dark/modo-dark.component';
import { AuthService } from '../../core/services/auth.service';

/**
 * RedefinirSenhaPaginaComponent
 * -----------------------------
 * Etapa 2 da recuperação de senha: o usuário informa o código recebido
 * por e-mail (campo `token`, pré-preenchido se a URL vier com
 * `?token=...`, como num link de e-mail) e a nova senha. Chama
 * POST /api/auth/redefinir-senha. O código vale por 30 minutos e só
 * pode ser usado uma vez (regra do back-end).
 */
@Component({
  selector: 'app-redefinir-senha-pagina',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PainelMarcaComponent, ModoDarkComponent],
  templateUrl: './redefinir-senha-pagina.component.html',
  styleUrl: './redefinir-senha-pagina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedefinirSenhaPaginaComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group({
    token: ['', [Validators.required]],
    novaSenha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', [Validators.required]],
  });

  protected readonly enviando = signal(false);
  protected readonly concluido = signal(false);
  protected readonly erro = signal<string | null>(null);

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.form.controls.token.setValue(token);
    }
  }

  protected enviar(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    if (v.novaSenha !== v.confirmarSenha) {
      this.erro.set('As senhas não coincidem.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    this.auth.redefinirSenha(v.token.trim(), v.novaSenha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.concluido.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(this.mensagemDeErro(e));
      },
    });
  }

  private mensagemDeErro(e: HttpErrorResponse): string {
    if (e.status === 400) {
      return (e.error?.mensagem as string | undefined) ?? 'Código inválido ou expirado.';
    }
    if (e.status === 0) {
      return 'Não foi possível conectar ao servidor. Verifique se a API está no ar.';
    }
    return 'Algo deu errado. Tente novamente.';
  }
}
