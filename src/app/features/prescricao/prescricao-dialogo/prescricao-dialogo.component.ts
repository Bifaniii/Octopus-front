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
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  InternacaoOpcao,
  MedicacaoOpcao,
  PrescricaoRequest,
} from '../prescricao.model';

// Modal de nova prescrição. Não conhece a API: recebe opções por @Input e emite o pedido por @Output.
@Component({
  selector: 'app-prescricao-dialogo',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './prescricao-dialogo.component.html',
  styleUrl: './prescricao-dialogo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescricaoDialogoComponent implements AfterViewInit {
  @Input() internacoes: InternacaoOpcao[] = [];
  @Input() medicacoes: MedicacaoOpcao[] = [];
  @Input() salvando = false;
  @Input() erro: string | null = null;
  @Output() salvar = new EventEmitter<PrescricaoRequest>();
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('dlg') private dlg!: ElementRef<HTMLDialogElement>;

  private readonly fb = inject(FormBuilder).nonNullable;

  readonly form = this.fb.group({
    internacaoId: this.fb.control<number | null>(null, Validators.required),
    observacao: this.fb.control('', Validators.maxLength(500)),
    itens: this.fb.array([this.novoItem()]),
  });

  get itens(): FormArray {
    return this.form.controls.itens as FormArray;
  }

  ngAfterViewInit(): void {
    this.dlg.nativeElement.showModal();
  }

  adicionarItem(): void {
    this.itens.push(this.novoItem());
  }

  removerItem(indice: number): void {
    if (this.itens.length > 1) this.itens.removeAt(indice);
  }

  cancelar(): void {
    this.dlg.nativeElement.close(); // dispara o evento "close", que emite "fechar"
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.salvar.emit({
      internacaoId: v.internacaoId as number,
      observacao: v.observacao.trim() || undefined,
      itens: v.itens.map((i: any) => ({
        medicacaoId: i.medicacaoId as number,
        dosagem: i.dosagem.trim(),
        intervaloHoras: Number(i.intervaloHoras),
        quantidadeDoses: Number(i.quantidadeDoses),
        // O datetime-local vem como "2026-10-10T08:00": enviar como está (nunca toISOString), só com segundos.
        inicio: i.inicio.length === 16 ? `${i.inicio}:00` : i.inicio,
        observacao: i.observacao.trim() || undefined,
      })),
    });
  }

  private novoItem() {
    return this.fb.group({
      medicacaoId: this.fb.control<number | null>(null, Validators.required),
      dosagem: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
      intervaloHoras: this.fb.control(8, [
        Validators.required,
        Validators.min(1),
        Validators.max(168),
      ]),
      // Os tetos são os mesmos do ItemPrescricaoRequest no back.
      quantidadeDoses: this.fb.control(3, [Validators.required, Validators.min(1), Validators.max(200)]),
      inicio: this.fb.control(this.agoraLocal(), Validators.required),
      observacao: this.fb.control('', Validators.maxLength(500)),
    });
  }

  // Hora local no formato do <input type="datetime-local">, sem converter para UTC.
  private agoraLocal(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
}
