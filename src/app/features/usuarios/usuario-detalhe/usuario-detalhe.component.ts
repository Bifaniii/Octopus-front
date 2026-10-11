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
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  DetalheUsuario,
  EdicaoUsuarioEvento,
  Especializacao,
  NOME_POR_ESPECIALIZACAO,
  NOME_POR_ROLE,
  TipoPessoa,
  UsuarioListagem,
} from '../usuario.model';

const SOMENTE_DIGITOS = /\D/g;

/** Uma linha da ficha: rótulo e valor já formatado. */
interface Campo {
  rotulo: string;
  valor: string;
}

/**
 * UsuarioDetalheComponent
 * -----------------------
 * Ficha completa de um usuário, aberta ao clicar na linha da lista. A linha já traz os dados da conta; os do
 * perfil (CPF, telefone, CRMV...) chegam em `detalhe`, buscados pelo container em /api/<perfil>/{id}. O admin não
 * tem dados de perfil além do nome, então para ele a ficha mostra só a conta.
 *
 * Quem pode editar vê o lápis no cabeçalho: a ficha vira um formulário com os mesmos campos e regras do cadastro,
 * sem a senha. Quem decide se está editando é o container (`editando`), que também chama a API.
 */
@Component({
  selector: 'app-usuario-detalhe',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './usuario-detalhe.component.html',
  styleUrl: './usuario-detalhe.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioDetalheComponent implements AfterViewInit {
  @Input({ required: true }) usuario!: UsuarioListagem;
  @Input() detalhe: DetalheUsuario | null = null;
  @Input() carregando = false;
  @Input() erro: string | null = null;
  @Input() podeDesativar = false;
  @Input() desativando = false;
  @Input() podeEditar = false;
  @Input() editando = false;
  @Input() salvando = false;
  @Input() erroEdicao: string | null = null;
  @Output() desativar = new EventEmitter<UsuarioListagem>();
  @Output() editar = new EventEmitter<void>();
  @Output() cancelarEdicao = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<EdicaoUsuarioEvento>();
  @Output() fechar = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  protected readonly especializacoes = Object.entries(NOME_POR_ESPECIALIZACAO) as [Especializacao, string][];

  protected readonly form = this.fb.nonNullable.group({
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    cpf: '',
    cpfCnpj: '',
    tipoPessoa: 'PF' as TipoPessoa,
    crmv: '',
    crmvUf: '',
    especializacao: 'GERAL' as Especializacao,
  });

  protected erroForm: string | null = null;

  @ViewChild('dialogo') private dialogo!: ElementRef<HTMLDialogElement>;

  /** Segundo clique em "Desativar" confirma. */
  protected confirmando = false;

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  /** O lápis só aparece quando já há tudo para preencher o formulário. */
  protected get mostrarLapis(): boolean {
    return this.podeEditar && !this.editando && (this.usuario.role === 'ROLE_ADMIN' || this.detalhe !== null);
  }

  protected iniciarEdicao(): void {
    const d = this.detalhe;
    this.form.reset({
      nome: this.usuario.nome,
      email: this.usuario.email,
      telefone: d?.telefone ?? '',
      dataNascimento: d?.dataNascimento ?? '',
      cpf: d && 'cpf' in d ? d.cpf : '',
      cpfCnpj: d && 'crmv' in d ? d.cpfCnpj : '',
      tipoPessoa: d && 'crmv' in d ? d.tipoPessoa : 'PF',
      crmv: d && 'crmv' in d ? d.crmv : '',
      crmvUf: d && 'crmv' in d ? d.crmvUf : '',
      especializacao: d && 'crmv' in d ? d.especializacao : 'GERAL',
    });
    this.erroForm = null;
    this.editar.emit();
  }

  protected enviarEdicao(): void {
    if (this.salvando) return;
    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const email = v.email.trim();
    if (!nome) return this.falhar('Informe o nome.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.falhar('Informe um e-mail válido.');

    const role = this.usuario.role;
    if (role === 'ROLE_ADMIN') {
      return this.emitir({ role, dados: { nome, email } });
    }

    const telefone = v.telefone.trim();
    if (!telefone) return this.falhar('Informe o telefone.');
    if (!v.dataNascimento) return this.falhar('Informe a data de nascimento.');

    if (role === 'ROLE_AUXILIAR' || role === 'ROLE_RECEPCIONISTA') {
      const cpf = v.cpf.replace(SOMENTE_DIGITOS, '');
      if (cpf.length !== 11) return this.falhar('CPF deve ter 11 dígitos.');
      return this.emitir({ role, dados: { nome, email, cpf, dataNascimento: v.dataNascimento, telefone } });
    }

    const cpfCnpj = v.cpfCnpj.replace(SOMENTE_DIGITOS, '');
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      return this.falhar('CPF/CNPJ deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).');
    }
    const crmv = v.crmv.trim();
    if (!crmv) return this.falhar('Informe o CRMV.');
    const crmvUf = v.crmvUf.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(crmvUf)) return this.falhar('UF do CRMV deve ter 2 letras (ex.: SP).');
    this.emitir({
      role: 'ROLE_VETERINARIO',
      dados: {
        nome,
        email,
        cpfCnpj,
        tipoPessoa: v.tipoPessoa,
        dataNascimento: v.dataNascimento,
        telefone,
        crmv,
        crmvUf,
        especializacao: v.especializacao,
      },
    });
  }

  private emitir(evento: EdicaoUsuarioEvento): void {
    this.erroForm = null;
    this.salvar.emit(evento);
  }

  private falhar(mensagem: string): void {
    this.erroForm = mensagem;
  }

  protected get papel(): string {
    return (NOME_POR_ROLE as Record<string, string>)[this.usuario.role] ?? this.usuario.role;
  }

  protected get conta(): Campo[] {
    const u = this.usuario;
    return [
      { rotulo: 'E-mail', valor: u.email },
      { rotulo: 'Papel', valor: this.papel },
      { rotulo: 'Situação', valor: u.ativo ? 'Ativo' : 'Inativo' },
      { rotulo: 'Cadastrado em', valor: this.dataHora(u.criadoEm) },
    ];
  }

  protected get perfil(): Campo[] {
    const d = this.detalhe;
    if (!d) return [];
    if ('crmv' in d) {
      return [
        { rotulo: d.tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF', valor: this.documento(d.cpfCnpj) },
        { rotulo: 'Tipo', valor: d.tipoPessoa === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física' },
        { rotulo: 'CRMV', valor: `${d.crmv}/${d.crmvUf}` },
        { rotulo: 'Especialização', valor: NOME_POR_ESPECIALIZACAO[d.especializacao] ?? d.especializacao },
        { rotulo: 'Data de nascimento', valor: this.data(d.dataNascimento) },
        { rotulo: 'Telefone', valor: this.telefone(d.telefone) },
      ];
    }
    return [
      { rotulo: 'CPF', valor: this.documento(d.cpf) },
      { rotulo: 'Data de nascimento', valor: this.data(d.dataNascimento) },
      { rotulo: 'Telefone', valor: this.telefone(d.telefone) },
    ];
  }

  protected fecharDialogo(): void {
    this.dialogo.nativeElement.close(); // dispara o evento `close`, que emite `fechar`
  }

  protected clicarDesativar(): void {
    if (!this.confirmando) {
      this.confirmando = true;
      return;
    }
    this.confirmando = false;
    this.desativar.emit(this.usuario);
  }

  /** aaaa-MM-dd → dd/MM/aaaa, sem passar por Date. */
  private data(valor: string): string {
    const [ano, mes, dia] = valor.slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private dataHora(valor: string): string {
    return `${this.data(valor)} às ${valor.slice(11, 16)}`;
  }

  private documento(numero: string): string {
    const d = numero.replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    return numero;
  }

  private telefone(numero: string): string {
    const d = numero.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return numero;
  }
}
