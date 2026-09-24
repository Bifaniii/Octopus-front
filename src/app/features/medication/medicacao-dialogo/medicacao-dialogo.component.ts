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
import { DadosMedicacao, Medicacao, NOME_POR_ESQUEMA, TipoEsquema } from '../medicacao.model';

/**
 * MedicacaoDialogoComponent
 * -------------------------
 * Janela (dialog nativo) para cadastrar um medicamento. Não conhece serviços:
 * valida o formulário com as mesmas regras do back-end (MedicacaoRequest),
 * avisa o container por eventos (`salvar`, `fechar`) e recebe de volta o
 * estado da chamada à API (`salvando`, `erroApi`).
 */
@Component({
  selector: 'app-medicacao-dialogo',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './medicacao-dialogo.component.html',
  styleUrl: './medicacao-dialogo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicacaoDialogoComponent implements AfterViewInit {
  /** Catálogo atual: opções de interação proibida e checagem de registro repetido. */
  @Input({ required: true }) medicacoes!: Medicacao[];
  /** Enquanto true, os botões ficam desabilitados. */
  @Input() salvando = false;
  /** Mensagem de erro vinda da API (ex.: registro ANVISA duplicado). */
  @Input() erroApi: string | null = null;

  @Output() salvar = new EventEmitter<DadosMedicacao>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  private readonly fb = inject(FormBuilder);

  protected readonly esquemas = (Object.keys(NOME_POR_ESQUEMA) as TipoEsquema[]).map((valor) => ({
    valor,
    nome: NOME_POR_ESQUEMA[valor],
  }));

  protected readonly form = this.fb.nonNullable.group({
    nomeComercial: [''],
    principioAtivo: [''],
    concentracao: [''],
    formaFarmaceutica: [''],
    unidadeMedidaEmbalagem: [''],
    tipoEsquema: ['CONTINUO' as TipoEsquema],
    dataVencimento: [''], // "AAAA-MM-DD" do <input type="date">
    fabricante: [''],
    numeroRegistroAnvisa: [''],
  });

  /** Ids marcados como interação proibida. */
  protected readonly interacoes = signal<ReadonlySet<string>>(new Set());
  protected readonly erro = signal<string | null>(null);

  /** O back-end exige data futura: o mínimo do calendário é amanhã. */
  protected readonly amanha = this.dataIso(new Date(Date.now() + 24 * 60 * 60 * 1000));

  protected get ativas(): Medicacao[] {
    return this.medicacoes.filter((m) => m.ativo);
  }

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  protected alternarInteracao(id: string, evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    this.interacoes.update((atual) => {
      const novo = new Set(atual);
      marcado ? novo.add(id) : novo.delete(id);
      return novo;
    });
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
    const texto = {
      nomeComercial: v.nomeComercial.trim(),
      principioAtivo: v.principioAtivo.trim(),
      concentracao: v.concentracao.trim(),
      formaFarmaceutica: v.formaFarmaceutica.trim(),
      unidadeMedidaEmbalagem: v.unidadeMedidaEmbalagem.trim(),
      fabricante: v.fabricante.trim(),
      numeroRegistroAnvisa: v.numeroRegistroAnvisa.replace(/\D/g, ''),
    };

    const limites: [keyof typeof texto, string, number][] = [
      ['nomeComercial', 'o nome comercial', 100],
      ['principioAtivo', 'o princípio ativo', 200],
      ['concentracao', 'a concentração', 50],
      ['formaFarmaceutica', 'a forma farmacêutica', 50],
      ['unidadeMedidaEmbalagem', 'a unidade de medida', 20],
      ['fabricante', 'o fabricante', 255],
    ];
    for (const [campo, nome, max] of limites) {
      if (!texto[campo]) {
        this.erro.set(`Informe ${nome}.`);
        return;
      }
      if (texto[campo].length > max) {
        this.erro.set(`Campo "${nome}" pode ter no máximo ${max} caracteres.`);
        return;
      }
    }

    if (!/^\d{11}$/.test(texto.numeroRegistroAnvisa)) {
      this.erro.set('O registro ANVISA deve ter exatamente 11 dígitos.');
      return;
    }
    if (this.medicacoes.some((m) => m.numeroRegistroAnvisa === texto.numeroRegistroAnvisa)) {
      this.erro.set(`Já existe um medicamento com o registro ANVISA ${texto.numeroRegistroAnvisa}.`);
      return;
    }

    if (!v.dataVencimento) {
      this.erro.set('Informe a data de vencimento.');
      return;
    }
    if (v.dataVencimento < this.amanha) {
      this.erro.set('A data de vencimento deve ser futura.');
      return;
    }

    this.erro.set(null);
    this.salvar.emit({
      ...texto,
      tipoEsquema: v.tipoEsquema,
      // O back-end recebe LocalDateTime: completa a data com meia-noite.
      dataVencimento: `${v.dataVencimento}T00:00:00`,
      interacoesProibidas: [...this.interacoes()],
    });
  }

  private dataIso(data: Date): string {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
  }
}