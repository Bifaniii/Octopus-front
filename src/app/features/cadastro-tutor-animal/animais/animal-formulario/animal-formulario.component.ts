import {
  DestroyRef,
  ElementRef,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { destacarCampo, limparDestaques } from '../../../../shared/mascaras/campo-invalido';
import { Animal, ESPECIES, Especie, NovoAnimalEvento, OpcaoMae, SEXOS, Sexo } from '../animal.model';

/**
 * AnimalFormularioComponent
 * -------------------------
 * Dados do animal: passo 2 do cadastro, novo animal de um tutor existente ou edição. Não conhece serviços:
 * valida com as regras do AnimalRequest do back e avisa o container por eventos (`salvar`, `voltar`).
 * A mãe é opcional e sai da lista `opcoesMae`, filtrada para as fêmeas da espécie escolhida, que é o que o back
 * aceita. Quem garante de verdade (fêmea, mesma espécie, sem ciclo) é o back, com 422.
 */
@Component({
  selector: 'app-animal-formulario',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './animal-formulario.component.html',
  styleUrl: './animal-formulario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalFormularioComponent implements OnInit {
  /** Animal em edição; `null` = cadastro. */
  @Input() animal: Animal | null = null;
  @Input() opcoesMae: OpcaoMae[] = [];
  @Input() titulo = 'Passo 2 de 2 · Animal';
  @Input() textoBotao = 'Cadastrar tutor e animal';
  /** "Precisa internar?" só faz sentido no cadastro. */
  @Input() perguntarInternacao = true;
  /** Enquanto true, os botões ficam desabilitados. */
  @Input() salvando = false;
  /** Mensagem de erro vinda da API. */
  @Input() erroApi: string | null = null;
  @Input() textoVoltar = 'Voltar';

  @Output() salvar = new EventEmitter<NovoAnimalEvento>();
  @Output() voltar = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly raiz = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  protected readonly especies = ESPECIES;
  protected readonly sexos = SEXOS;

  /** Hoje na hora local (aaaa-MM-dd). Sem toISOString(), que converte para UTC e pode virar o dia. */
  protected readonly hoje = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  protected readonly form = this.fb.nonNullable.group({
    nome: [''],
    especie: this.fb.control<Especie | null>(null),
    sexo: this.fb.control<Sexo | null>(null),
    dataAntirrabica: [''],
    maeId: this.fb.control<number | null>(null),
    precisaInternar: [false],
  });

  protected readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    const a = this.animal;
    if (a) {
      this.form.reset({
        nome: a.nome,
        especie: a.especie,
        sexo: a.sexo,
        dataAntirrabica: a.dataUltimaAntirrabica ?? '',
        maeId: a.maeId,
        precisaInternar: false,
      });
    }
    // Trocar a espécie tira a mãe escolhida, se ela deixar de ser compatível.
    this.form.controls.especie.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const maeId = this.form.controls.maeId.value;
      if (maeId !== null && !this.maes.some((m) => m.id === maeId)) {
        this.form.controls.maeId.setValue(null);
      }
    });
  }

  /**
   * Só fêmeas da espécie escolhida, sem o próprio animal. A mãe já gravada continua na lista mesmo que o cadastro
   * dela esteja incompleto (sem sexo), para a edição não apagá-la sem querer; ao salvar, o back confere.
   */
  protected get maes(): OpcaoMae[] {
    const especie = this.form.controls.especie.value;
    const maeAtual = this.animal?.maeId ?? null;
    return this.opcoesMae.filter(
      (o) =>
        o.id !== this.animal?.id &&
        (o.id === maeAtual || (o.sexo === 'FEMEA' && especie !== null && o.especie === especie)),
    );
  }

  protected enviar(): void {
    if (this.salvando) return;
    limparDestaques(this.raiz);

    const v = this.form.getRawValue();
    const nome = v.nome.trim();

    if (!nome) return this.setErro('Informe o nome do animal.', 'nome');
    if (nome.length > 100) return this.setErro('O nome pode ter no máximo 100 caracteres.', 'nome');
    if (!v.especie) return this.setErro('Escolha a espécie.', 'especie');
    if (!v.sexo) return this.setErro('Escolha o sexo do animal.', 'sexo');
    if (v.dataAntirrabica && v.dataAntirrabica > this.hoje) {
      return this.setErro('A data da última antirrábica não pode ser futura.', 'dataAntirrabica');
    }
    if (v.dataAntirrabica && v.dataAntirrabica < '1990-01-01') {
      return this.setErro('A data da última antirrábica parece errada: informe o ano com 4 dígitos.', 'dataAntirrabica');
    }

    this.erro.set(null);
    this.salvar.emit({
      dados: { nome, especie: v.especie, sexo: v.sexo, dataAntirrabica: v.dataAntirrabica || null, maeId: v.maeId },
      precisaInternar: v.precisaInternar,
    });
  }

  private setErro(mensagem: string, campo: string): void {
    this.erro.set(mensagem);
    destacarCampo(this.raiz, campo);
  }
}
