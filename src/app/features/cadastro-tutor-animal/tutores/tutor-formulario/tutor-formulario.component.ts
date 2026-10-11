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

/**
 * TutorFormularioComponent
 * ------------------------
 * Dados do tutor: passo 1 do cadastro ou edição de um tutor existente. Não conhece serviços: valida com as
 * mesmas regras do TutorRequest do back e avisa o container por eventos (`avancar`, `cancelar`). Recebe
 * `tutor` para reabrir preenchido (ao voltar do passo 2 ou ao editar).
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
  /** Dados já digitados ou do tutor em edição. `null` = formulário vazio. */
  @Input() tutor: Omit<DadosTutor, 'animais'> | null = null;
  @Input() titulo = 'Passo 1 de 2 · Tutor';
  @Input() textoBotao = 'Próximo';
  @Input() salvando = false;
  @Input() erroApi: string | null = null;
  @Output() avancar = new EventEmitter<DadosTutor>();
  @Output() cancelar = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  /** Hoje na hora local (aaaa-MM-dd). Sem toISOString(), que converte para UTC e pode virar o dia. */
  protected readonly hoje = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  protected readonly form = this.fb.nonNullable.group({
    nome: [''],
    endereco: [''],
    dataNascimento: [''],
    telefone: [''],
  });

  protected readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    const t = this.tutor;
    if (t) {
      this.form.reset({ nome: t.nome, endereco: t.endereco, dataNascimento: t.dataNascimento, telefone: t.telefone });
    }
  }

  protected enviar(): void {
    if (this.salvando) return;
    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const endereco = v.endereco.trim();
    const telefone = v.telefone.replace(SOMENTE_DIGITOS, '');

    if (!nome) return this.setErro('Informe o nome do tutor.');
    if (nome.length > 100) return this.setErro('O nome pode ter no máximo 100 caracteres.');
    if (!endereco) return this.setErro('Informe o endereço.');
    if (endereco.length > 255) return this.setErro('O endereço pode ter no máximo 255 caracteres.');
    if (!v.dataNascimento) return this.setErro('Informe a data de nascimento.');
    if (v.dataNascimento >= this.hoje) return this.setErro('A data de nascimento precisa ser anterior a hoje.');
    if (telefone.length < 10 || telefone.length > 11) {
      return this.setErro('Telefone deve ter DDD + 8 ou 9 dígitos.');
    }

    this.erro.set(null);
    this.avancar.emit({ nome, endereco, dataNascimento: v.dataNascimento, telefone });
  }

  private setErro(mensagem: string): void {
    this.erro.set(mensagem);
  }
}
