import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { destacarCampo, limparDestaques } from '../../../shared/mascaras/campo-invalido';
import { CpfCnpjDirective, CpfDirective } from '../../../shared/mascaras/documento.directive';
import { TelefoneDirective } from '../../../shared/mascaras/telefone.directive';
import { UfDirective } from '../../../shared/mascaras/texto.directive';
import {
  cnpjValido,
  cpfValido,
  crmvValido,
  emailValido,
  hojeLocal,
  nomeValido,
  problemaNaDataDeNascimento,
  telefoneValido,
  ufValida,
} from '../../../shared/mascaras/validacoes';
import {
  Especializacao,
  NOME_POR_ESPECIALIZACAO,
  NOME_POR_ROLE,
  NovoUsuarioEvento,
  RoleCriavel,
  TipoPessoa,
} from '../usuario.model';


/**
 * UsuarioDialogoComponent
 * -----------------------
 * Janela (dialog nativo) para cadastrar um usuário novo. O back-end
 * não tem um endpoint único de "usuário": cada papel (Admin,
 * Veterinário, Auxiliar, Recepcionista) tem seu próprio endpoint e
 * seus próprios campos obrigatórios. Por isso o formulário muda de
 * cara conforme o papel escolhido no topo — e a validação (manual,
 * igual ao BaiaDialogoComponent) também muda por papel.
 */
@Component({
  selector: 'app-usuario-dialogo',
  standalone: true,
  imports: [ReactiveFormsModule, TelefoneDirective, CpfDirective, CpfCnpjDirective, UfDirective],
  templateUrl: './usuario-dialogo.component.html',
  styleUrl: './usuario-dialogo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioDialogoComponent implements AfterViewInit {
  /** Enquanto true, os botões ficam desabilitados. */
  @Input() salvando = false;
  /** Mensagem de erro vinda da API (ex.: e-mail/CPF/CRMV já cadastrado). */
  @Input() erroApi: string | null = null;

  @Output() salvar = new EventEmitter<NovoUsuarioEvento>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  private readonly fb = inject(FormBuilder);

  protected readonly papeis = (Object.keys(NOME_POR_ROLE) as RoleCriavel[]).map((valor) => ({
    valor,
    nome: NOME_POR_ROLE[valor],
  }));
  protected readonly especializacoes = (Object.keys(NOME_POR_ESPECIALIZACAO) as Especializacao[]).map(
    (valor) => ({ valor, nome: NOME_POR_ESPECIALIZACAO[valor] }),
  );

  protected readonly form = this.fb.nonNullable.group({
    role: 'ROLE_VETERINARIO' as RoleCriavel,
    nome: '',
    email: '',
    senha: '',
    // Veterinário, Auxiliar, Recepcionista
    telefone: '',
    dataNascimento: '',
    // Auxiliar, Recepcionista
    cpf: '',
    // Veterinário
    cpfCnpj: '',
    tipoPessoa: 'PF' as TipoPessoa,
    crmv: '',
    crmvUf: '',
    especializacao: '' as Especializacao | '',
  });

  protected readonly erro = signal<string | null>(null);

  protected readonly hoje = hojeLocal();

  constructor() {
    // O tamanho do documento diz o tipo: 11 dígitos é pessoa física, 14 é jurídica. Dá para trocar à mão depois.
    this.form.controls.cpfCnpj.valueChanges.pipe(takeUntilDestroyed()).subscribe((digitos) => {
      if (digitos.length === 11) this.form.controls.tipoPessoa.setValue('PF');
      if (digitos.length === 14) this.form.controls.tipoPessoa.setValue('PJ');
    });
  }

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  protected get role(): RoleCriavel {
    return this.form.controls.role.value;
  }

  protected fecharDialogo(): void {
    this.dialogo.nativeElement.close(); // dispara o evento `close`, que emite `fechar`
  }

  protected enviar(): void {
    if (this.salvando) return;
    limparDestaques(this.dialogo.nativeElement);

    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const email = v.email.trim();
    const senha = v.senha;

    if (!nome) return this.setErro('Informe o nome.', 'nome');
    if (!nomeValido(nome)) return this.setErro('O nome precisa ter letras.', 'nome');
    if (nome.length > 100) return this.setErro('O nome pode ter no máximo 100 caracteres.', 'nome');
    if (!email) return this.setErro('Informe o e-mail.', 'email');
    if (!emailValido(email)) return this.setErro('Informe um e-mail válido, como nome@clinica.com.', 'email');
    if (!senha || senha.length < 8) return this.setErro('A senha deve ter pelo menos 8 caracteres.', 'senha');
    if (senha.length > 100) return this.setErro('A senha pode ter no máximo 100 caracteres.', 'senha');

    if (v.role === 'ROLE_ADMIN') {
      this.setErro(null);
      this.salvar.emit({ role: 'ROLE_ADMIN', dados: { nome, email, senha } });
      return;
    }

    const telefone = v.telefone;
    if (!telefoneValido(telefone)) {
      return this.setErro('Informe um telefone válido com DDD, por exemplo (11) 98765-4321.', 'telefone');
    }
    const problemaNaData = problemaNaDataDeNascimento(v.dataNascimento, this.hoje);
    if (problemaNaData) return this.setErro(problemaNaData, 'dataNascimento');

    if (v.role === 'ROLE_AUXILIAR' || v.role === 'ROLE_RECEPCIONISTA') {
      const cpf = v.cpf;
      if (!cpfValido(cpf)) return this.setErro('CPF inválido. Confira os 11 dígitos.', 'cpf');

      this.setErro(null);
      const dados = { nome, email, senha, cpf, dataNascimento: v.dataNascimento, telefone };
      this.salvar.emit(
        v.role === 'ROLE_AUXILIAR'
          ? { role: 'ROLE_AUXILIAR', dados }
          : { role: 'ROLE_RECEPCIONISTA', dados },
      );
      return;
    }

    // ROLE_VETERINARIO
    const cpfCnpj = v.cpfCnpj;
    if (v.tipoPessoa === 'PF' && !cpfValido(cpfCnpj)) {
      return this.setErro('CPF inválido. Pessoa física precisa de um CPF com 11 dígitos.', 'cpfCnpj');
    }
    if (v.tipoPessoa === 'PJ' && !cnpjValido(cpfCnpj)) {
      return this.setErro('CNPJ inválido. Pessoa jurídica precisa de um CNPJ com 14 dígitos.', 'cpfCnpj');
    }
    const crmv = v.crmv.trim();
    if (!crmv) return this.setErro('Informe o CRMV.', 'crmv');
    if (!crmvValido(crmv)) return this.setErro('O CRMV só pode ter letras, números, ponto, hífen ou barra (até 20).', 'crmv');
    const crmvUf = v.crmvUf.trim().toUpperCase();
    if (!ufValida(crmvUf)) return this.setErro('Informe a sigla de um estado, como SP.', 'crmvUf');

    this.setErro(null);
    this.salvar.emit({
      role: 'ROLE_VETERINARIO',
      dados: {
        nome,
        email,
        senha,
        cpfCnpj,
        tipoPessoa: v.tipoPessoa,
        dataNascimento: v.dataNascimento,
        telefone,
        crmv,
        crmvUf,
        especializacao: v.especializacao || null,
      },
    });
  }

  private setErro(mensagem: string | null, campo?: string): void {
    this.erro.set(mensagem);
    if (mensagem && campo) destacarCampo(this.dialogo.nativeElement, campo);
  }
}
