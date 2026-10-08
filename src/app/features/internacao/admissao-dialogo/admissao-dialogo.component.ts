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
import { Baia, CAPACIDADE_MAXIMA, NOME_POR_TIPO, TipoBaia } from '../../baias/baia.model';
import { Animal, DadosAdmissao, antirrabicaVencida } from '../internacao.model';

/** Card de baia do formulário, já com a ocupação e o motivo de estar bloqueada (se estiver). */
interface OpcaoBaia {
  baia: Baia;
  tipo: string;
  ocupadas: number;
  capacidade: number;
  bloqueio: string | null;
}

/** Ordem dos cards: isolamento primeiro, que é para onde vai o animal com a antirrábica vencida. */
const ORDEM_TIPO: Record<TipoBaia, number> = { ISOLAMENTO: 0, COLETIVA: 1, NINHADA: 2 };

/**
 * AdmissaoDialogoComponent
 * ------------------------
 * Formulário de nova internação: animal, baia e motivo. Antecipa as regras do back para evitar erro
 * previsível (baia lotada, RN-02 só isolamento, ninhada sem mãe), mas quem decide é o back: o erro dele
 * chega por `erroApi`. Não conhece serviços.
 */
@Component({
  selector: 'app-admissao-dialogo',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admissao-dialogo.component.html',
  styleUrls: ['../dialogo.css', './admissao-dialogo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissaoDialogoComponent implements AfterViewInit {
  /** `null` enquanto a lista de animais carrega. */
  @Input() animais: Animal[] | null = null;
  /** Ids dos animais com internação aberta (não podem ser admitidos de novo). */
  @Input() internados = new Set<string>();
  /** Baias ativas. */
  @Input({ required: true }) baias!: Baia[];
  /** Quantas internações abertas há em cada baia (baiaId → ocupação). */
  @Input() ocupacao: Record<string, number> = {};
  @Input() salvando = false;
  @Input() erroApi: string | null = null;

  @Output() salvar = new EventEmitter<DadosAdmissao>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    animalId: [''],
    baiaId: [''],
    motivo: [''],
  });

  protected readonly animal = signal<Animal | null>(null);
  protected readonly erro = signal<string | null>(null);

  ngAfterViewInit(): void {
    this.dialogo.nativeElement.showModal();
  }

  protected get disponiveis(): Animal[] {
    return (this.animais ?? []).filter((a) => !this.internados.has(a.id));
  }

  protected get vacinaVencida(): boolean {
    const a = this.animal();
    return a !== null && antirrabicaVencida(a.dataUltimaAntirrabica);
  }

  /** Baias ativas, com as que o back recusaria marcadas como bloqueadas. */
  protected get opcoes(): OpcaoBaia[] {
    const animal = this.animal();
    return [...this.baias]
      .sort(
        (a, b) =>
          ORDEM_TIPO[a.tipo] - ORDEM_TIPO[b.tipo] || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }),
      )
      .map((baia) => {
        const capacidade = Math.min(baia.capacidade, CAPACIDADE_MAXIMA[baia.tipo]);
        const ocupadas = this.ocupacao[baia.id] ?? 0;
        let bloqueio: string | null = null;
        if (ocupadas >= capacidade) {
          bloqueio = 'lotada';
        } else if (animal && this.vacinaVencida && baia.tipo !== 'ISOLAMENTO') {
          bloqueio = 'antirrábica vencida: só isolamento';
        } else if (animal && baia.tipo === 'NINHADA' && !animal.maeId) {
          bloqueio = 'ninhada exige mãe cadastrada';
        }
        return { baia, tipo: NOME_POR_TIPO[baia.tipo], ocupadas, capacidade, bloqueio };
      });
  }

  protected aoEscolherAnimal(): void {
    const id = this.form.controls.animalId.value;
    this.animal.set(this.disponiveis.find((a) => a.id === id) ?? null);
    // A baia escolhida antes pode ter ficado bloqueada para este animal.
    const baia = this.opcoes.find((o) => o.baia.id === this.form.controls.baiaId.value);
    if (baia?.bloqueio) {
      this.form.controls.baiaId.setValue('');
    }
  }

  protected escolherBaia(id: string): void {
    this.form.controls.baiaId.setValue(id);
  }

  protected fecharDialogo(): void {
    this.dialogo.nativeElement.close(); // dispara o evento `close`, que emite `fechar`
  }

  protected enviar(): void {
    if (this.salvando) return;
    const v = this.form.getRawValue();
    const motivo = v.motivo.trim();

    if (!v.animalId) {
      this.erro.set('Escolha o animal.');
      return;
    }
    if (!v.baiaId) {
      this.erro.set('Escolha a baia.');
      return;
    }
    if (!motivo) {
      this.erro.set('Informe o motivo da internação.');
      return;
    }
    if (motivo.length > 500) {
      this.erro.set('O motivo pode ter no máximo 500 caracteres.');
      return;
    }
    this.erro.set(null);
    this.salvar.emit({ animalId: v.animalId, baiaId: v.baiaId, motivo });
  }
}
