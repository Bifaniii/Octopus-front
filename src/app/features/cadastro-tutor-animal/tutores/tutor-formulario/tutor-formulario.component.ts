import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DadosTutor, SOMENTE_DIGITOS } from '../tutor.model';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * TutorFormularioComponent
 * ------------------------
 * Formulário do passo 1 (dados do tutor). Não conhece serviços: valida com as mesmas regras do back e avisa
 * o container por eventos (`avancar`, `cancelar`). Recebe `tutor` para reabrir preenchido quando o usuário
 * volta do passo 2.
 */
@Component({
  selector: 'app-tutor-formulario',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './tutor-formulario.component.html',
  styleUrl: './tutor-formulario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorFormularioComponent implements OnInit {
  /** Dados já digitados (ao voltar do passo 2). `null` = formulário vazio. */
  @Input() tutor: DadosTutor | null = null;
  @Output() avancar = new EventEmitter<DadosTutor>();
  @Output() cancelar = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    nome: [''],
    cpf: [''],
    telefone: [''],
    email: [''],
  });

  protected readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    const t = this.tutor;
    if (t) {
      this.form.reset({ nome: t.nome, cpf: t.cpf, telefone: t.telefone, email: t.email ?? '' });
    }
  }

  protected enviar(): void {
    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const cpf = v.cpf.replace(SOMENTE_DIGITOS, '');
    const telefone = v.telefone.replace(SOMENTE_DIGITOS, '');
    const email = v.email.trim();

    if (!nome) return this.setErro('Informe o nome do tutor.');
    if (nome.length > 100) return this.setErro('O nome pode ter no máximo 100 caracteres.');
    if (cpf.length !== 11) return this.setErro('CPF deve ter 11 dígitos.');
    if (telefone.length < 10 || telefone.length > 11) {
      return this.setErro('Telefone deve ter DDD + 8 ou 9 dígitos.');
    }
    if (email && (!EMAIL_VALIDO.test(email) || email.length > 100)) {
      return this.setErro('Informe um e-mail válido.');
    }

    this.erro.set(null);
    this.avancar.emit({ nome, cpf, telefone, email: email || null });
  }

  private setErro(mensagem: string): void {
    this.erro.set(mensagem);
  }
}
