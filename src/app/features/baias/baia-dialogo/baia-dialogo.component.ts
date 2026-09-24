import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Baia, CAPACIDADE_MAXIMA, DadosBaia, NOME_POR_TIPO, TipoBaia } from '../baia.model';

/**
 * BaiaDialogoComponent
 * --------------------
 * Janela (dialog nativo) para cadastrar uma baia nova ou editar uma existente.
 * Não conhece serviços: valida o formulário com as mesmas regras do back-end,
 * avisa o container por eventos (`salvar`, `desativar`, `fechar`) e recebe
 * de volta o estado da chamada à API (`salvando`, `erroApi`).
 */
@Component({
  selector: 'app-baia-dialogo',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './baia-dialogo.component.html',
  styleUrl: './baia-dialogo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaiaDialogoComponent implements OnInit, AfterViewInit {
  /** Baia em edição. `null` significa cadastro de uma nova. */
  @Input() baia: Baia | null = null;
  /** Todas as baias, só para checar nome repetido antes de chamar a API. */
  @Input({ required: true }) baias!: Baia[];
  /** Enquanto true, os botões ficam desabilitados. */
  @Input() salvando = false;
  /** Mensagem de erro vinda da API (ex.: nome duplicado, limite atingido). */
  @Input() erroApi: string | null = null;

  @Output() salvar = new EventEmitter<DadosBaia>();
  @Output() desativar = new EventEmitter<void>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  private readonly fb = inject(FormBuilder);

  protected readonly tipos = (Object.keys(NOME_POR_TIPO) as TipoBaia[]).map((valor) => ({
    valor,
    nome: `${NOME_POR_TIPO[valor]} (até ${CAPACIDADE_MAXIMA[valor]})`,
  }));

  protected readonly form = this.fb.nonNullable.group({
    tipo: ['COLETIVA' as TipoBaia],
    nome: [''],
    capacidade: [1],
    descricao: [''],
  });

  protected readonly capacidadeMaxima = signal(CAPACIDADE_MAXIMA.COLETIVA);
  protected readonly erro = signal<string | null>(null);
  protected readonly confirmandoDesativacao = signal(false);

  protected get editando(): boolean {
    return this.baia !== null;
  }

  protected get titulo(): string {
    return this.baia ? `Editar ${this.baia.nome}` : 'Nova baia';
  }

  ngOnInit(): void {
    const b = this.baia;
    if (b) {
      this.form.reset({
        tipo: b.tipo,
        nome: b.nome,
        capacidade: b.capacidade,
        descricao: b.descricao ?? '',
      });
      this.capacidadeMaxima.set(CAPACIDADE_MAXIMA[b.tipo]);
    }
  }

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  protected aoMudarTipo(): void {
    const maxima = CAPACIDADE_MAXIMA[this.form.controls.tipo.value];
    this.capacidadeMaxima.set(maxima);
    if (this.form.controls.capacidade.value > maxima) {
      this.form.controls.capacidade.setValue(maxima);
    }
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
    const capacidade = Number(v.capacidade);
    const maxima = CAPACIDADE_MAXIMA[v.tipo];

    if (!nome) {
      this.erro.set('Informe o nome da baia.');
      return;
    }
    if (nome.length > 25) {
      this.erro.set('O nome pode ter no máximo 25 caracteres.');
      return;
    }
    if (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > maxima) {
      this.erro.set(`A capacidade de uma baia ${NOME_POR_TIPO[v.tipo]} vai de 1 a ${maxima}.`);
      return;
    }

    const repetida = this.baias.some(
      (b) => b.nome.toLowerCase() === nome.toLowerCase() && b.id !== this.baia?.id,
    );
    if (repetida) {
      this.erro.set(`Já existe uma baia com o nome "${nome}".`);
      return;
    }

    const descricao = v.descricao.trim();
    if (descricao.length > 255) {
      this.erro.set('A descrição pode ter no máximo 255 caracteres.');
      return;
    }

    this.erro.set(null);
    this.salvar.emit({ tipo: v.tipo, nome, capacidade, descricao: descricao || null });
  }

  protected pedirDesativacao(): void {
    // Dois cliques: o primeiro pede confirmação, o segundo desativa.
    if (this.confirmandoDesativacao()) {
      this.desativar.emit();
    } else {
      this.confirmandoDesativacao.set(true);
    }
  }
}
