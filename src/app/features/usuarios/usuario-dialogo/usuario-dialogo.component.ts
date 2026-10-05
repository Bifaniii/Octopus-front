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
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  Especializacao,
  NOME_POR_ESPECIALIZACAO,
  NOME_POR_ROLE,
  NovoUsuarioEvento,
  RoleCriavel,
  TipoPessoa,
} from '../usuario.model';

const SOMENTE_DIGITOS = /\D/g;

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
  imports: [ReactiveFormsModule],
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

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  protected get role(): RoleCriavel {
    return this.form.controls.role.value;
  }

  protected aoClicarFora(evento: MouseEvent): void {
    // Clique no fundo escurecido (o alvo é o próprio <dialog>).
    if (evento.target === this.dialogo.nativeElement) {
      this.fecharDialogo();
    }
  }

  protected fecharDialogo(): void {
    this.dialogo.nativeElement.close(); // dispara o evento `close`, que emite `fechar`
  }

  protected enviar(): void {
    if (this.salvando) return;

    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const email = v.email.trim();
    const senha = v.senha;

    if (!nome) return this.setErro('Informe o nome.');
    if (!email) return this.setErro('Informe o e-mail.');
    if (!senha || senha.length < 6) return this.setErro('A senha deve ter pelo menos 6 caracteres.');

    if (v.role === 'ROLE_ADMIN') {
      this.setErro(null);
      this.salvar.emit({ role: 'ROLE_ADMIN', dados: { nome, email, senha } });
      return;
    }

    const telefone = v.telefone.trim();
    if (!telefone) return this.setErro('Informe o telefone.');
    if (!v.dataNascimento) return this.setErro('Informe a data de nascimento.');

    if (v.role === 'ROLE_AUXILIAR' || v.role === 'ROLE_RECEPCIONISTA') {
      const cpf = v.cpf.replace(SOMENTE_DIGITOS, '');
      if (cpf.length !== 11) return this.setErro('CPF deve ter 11 dígitos.');

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
    const cpfCnpj = v.cpfCnpj.replace(SOMENTE_DIGITOS, '');
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      return this.setErro('CPF/CNPJ deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).');
    }
    const crmv = v.crmv.trim();
    if (!crmv) return this.setErro('Informe o CRMV.');
    const crmvUf = v.crmvUf.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(crmvUf)) return this.setErro('UF do CRMV deve ter 2 letras (ex.: SP).');

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

  private setErro(mensagem: string | null): void {
    this.erro.set(mensagem);
  }
}
