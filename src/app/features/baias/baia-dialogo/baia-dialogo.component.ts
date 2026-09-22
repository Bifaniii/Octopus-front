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
import { Baia, DadosBaia, NOME_POR_TIPO, ROTULO_POR_TIPO, StatusBaia, TipoBaia } from '../baia.model';

/**
 * BaiaDialogoComponent
 * --------------------
 * Janela (dialog nativo) para cadastrar uma baia nova ou editar uma existente.
 * Não conhece serviços: recebe a lista de baias só para validar número repetido
 * e avisa o container por eventos (`salvar`, `remover`, `fechar`).
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
  /** Todas as baias, só para checar número repetido e sugerir o próximo. */
  @Input({ required: true }) baias!: Baia[];

  @Output() salvar = new EventEmitter<DadosBaia>();
  @Output() remover = new EventEmitter<void>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  private readonly fb = inject(FormBuilder);

  protected readonly tipos = (Object.keys(NOME_POR_TIPO) as TipoBaia[]).map((valor) => ({
    valor,
    nome: NOME_POR_TIPO[valor],
  }));

  protected readonly form = this.fb.nonNullable.group({
    tipo: ['padrao' as TipoBaia],
    numero: [1],
    status: ['livre' as StatusBaia],
    descricao: [''],
    detalhe: [''],
  });

  protected readonly ocupada = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly confirmandoRemocao = signal(false);

  protected get editando(): boolean {
    return this.baia !== null;
  }

  protected get titulo(): string {
    if (!this.baia) return 'Nova baia';
    return `Editar ${ROTULO_POR_TIPO[this.baia.tipo]} ${this.formatar(this.baia.numero)}`;
  }

  ngOnInit(): void {
    const b = this.baia;
    if (b) {
      this.form.reset({
        tipo: b.tipo,
        numero: b.numero,
        status: b.status,
        descricao: b.descricao ?? '',
        detalhe: b.detalhe ?? '',
      });
      // O tipo não muda depois de criada, para não bagunçar a numeração.
      this.form.controls.tipo.disable();
      this.ocupada.set(b.status === 'ocupada');
    } else {
      this.form.controls.numero.setValue(this.proximoNumero('padrao'));
    }
  }

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  protected aoMudarTipo(): void {
    if (!this.baia) {
      this.form.controls.numero.setValue(this.proximoNumero(this.form.controls.tipo.value));
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
    const v = this.form.getRawValue();
    const numero = Number(v.numero);

    if (!Number.isInteger(numero) || numero < 1) {
      this.erro.set('Informe um número de baia maior que zero.');
      return;
    }

    const repetida = this.baias.some(
      (b) => b.tipo === v.tipo && b.numero === numero && b.id !== this.baia?.id,
    );
    if (repetida) {
      this.erro.set(`Já existe a ${ROTULO_POR_TIPO[v.tipo]} ${this.formatar(numero)}.`);
      return;
    }

    const descricao = v.descricao.trim();
    if (v.status === 'ocupada' && !descricao) {
      this.erro.set('Informe o animal e o atendimento.');
      return;
    }

    this.erro.set(null);
    this.salvar.emit({
      tipo: v.tipo,
      numero,
      status: v.status,
      descricao: descricao || undefined,
      detalhe: v.detalhe.trim() || undefined,
    });
  }

  protected pedirRemocao(): void {
    // Dois cliques: o primeiro pede confirmação, o segundo remove.
    if (this.confirmandoRemocao()) {
      this.remover.emit();
    } else {
      this.confirmandoRemocao.set(true);
    }
  }

  private proximoNumero(tipo: TipoBaia): number {
    const numeros = this.baias.filter((b) => b.tipo === tipo).map((b) => b.numero);
    return Math.max(0, ...numeros) + 1;
  }

  private formatar(numero: number): string {
    return String(numero).padStart(2, '0');
  }
}
