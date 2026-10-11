import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  DetalheUsuario,
  NOME_POR_ESPECIALIZACAO,
  NOME_POR_ROLE,
  UsuarioListagem,
} from '../usuario.model';

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
 */
@Component({
  selector: 'app-usuario-detalhe',
  standalone: true,
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
  @Output() desativar = new EventEmitter<UsuarioListagem>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo') private dialogo!: ElementRef<HTMLDialogElement>;

  /** Segundo clique em "Desativar" confirma. */
  protected confirmando = false;

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
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
