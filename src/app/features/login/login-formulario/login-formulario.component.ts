import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

/** Formato dos dados emitidos quando o usuário envia o formulário. */
export interface Credenciais {
  email: string;
  senha: string;
}

/**
 * LoginFormularioComponent
 * ------------------------
 * Formulário de acesso (e-mail + senha + "Entrar"). É um componente
 * de APRESENTAÇÃO: valida o formulário e emite `(login)` com os dados.
 * Ele NÃO conhece a API — quem chama o AuthService é o container
 * (LoginPaginaComponent), que devolve o estado via @Input
 * (`carregando`, `erro`) para o formulário exibir.
 */
@Component({
  selector: 'app-login-formulario',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-formulario.component.html',
  styleUrl: './login-formulario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormularioComponent {
  /** Enquanto true, o botão fica desabilitado e mostra "Entrando...". */
  @Input() carregando = false;

  /** Mensagem de erro vinda da API (ex.: credenciais inválidas). */
  @Input() erro: string | null = null;

  /** Emite os dados do formulário quando ele é enviado e é válido. */
  @Output() login = new EventEmitter<Credenciais>();

  private readonly fb = new FormBuilder();

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected onSubmit(): void {
    if (this.form.invalid || this.carregando) {
      this.form.markAllAsTouched();
      return;
    }
    this.login.emit(this.form.getRawValue());
  }
}
