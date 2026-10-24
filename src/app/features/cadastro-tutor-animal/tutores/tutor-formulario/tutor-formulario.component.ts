import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { destacarCampo, limparDestaques } from '../../../../shared/mascaras/campo-invalido';
import { hojeLocal, nomeValido, problemaNaDataDeNascimento, telefoneValido } from '../../../../shared/mascaras/validacoes';
import { TelefoneDirective } from '../../../../shared/mascaras/telefone.directive';
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
  imports: [ReactiveFormsModule, TelefoneDirective],
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
  private readonly raiz = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly hoje = hojeLocal();

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
    limparDestaques(this.raiz);
    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const endereco = v.endereco.trim();
    const telefone = v.telefone.replace(SOMENTE_DIGITOS, '');

    if (!nome) return this.setErro('Informe o nome do tutor.', 'nome');
    if (!nomeValido(nome)) return this.setErro('O nome precisa ter letras.', 'nome');
    if (nome.length > 100) return this.setErro('O nome pode ter no máximo 100 caracteres.', 'nome');
    if (!endereco) return this.setErro('Informe o endereço.', 'endereco');
    if (endereco.length > 255) return this.setErro('O endereço pode ter no máximo 255 caracteres.', 'endereco');
    const problemaNaData = problemaNaDataDeNascimento(v.dataNascimento, this.hoje);
    if (problemaNaData) return this.setErro(problemaNaData, 'dataNascimento');
    if (!telefoneValido(telefone)) {
      return this.setErro('Informe um celular com DDD, por exemplo (11) 98765-4321.', 'telefone');
    }

    this.erro.set(null);
    this.avancar.emit({ nome, endereco, dataNascimento: v.dataNascimento, telefone });
  }

  private setErro(mensagem: string, campo: string): void {
    this.erro.set(mensagem);
    destacarCampo(this.raiz, campo);
  }
}
