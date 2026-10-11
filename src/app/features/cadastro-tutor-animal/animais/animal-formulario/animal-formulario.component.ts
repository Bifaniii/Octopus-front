import {
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
import { Animal, NovoAnimalEvento, OpcaoMae } from '../animal.model';

/**
 * AnimalFormularioComponent
 * -------------------------
 * Dados do animal: passo 2 do cadastro, novo animal de um tutor existente ou edição. Não conhece serviços:
 * valida com as regras do AnimalRequest do back e avisa o container por eventos (`salvar`, `voltar`).
 * A mãe é opcional e sai da lista `opcoesMae`; quem garante que ela é válida (existe e não cria ciclo) é o back.
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

  /** Hoje na hora local (aaaa-MM-dd). Sem toISOString(), que converte para UTC e pode virar o dia. */
  protected readonly hoje = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  protected readonly form = this.fb.nonNullable.group({
    nome: [''],
    especie: [''],
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
        dataAntirrabica: a.dataUltimaAntirrabica ?? '',
        maeId: a.maeId,
        precisaInternar: false,
      });
    }
  }

  /** A própria opção some da lista quando o animal está em edição. */
  protected get maes(): OpcaoMae[] {
    return this.opcoesMae.filter((o) => o.id !== this.animal?.id);
  }

  protected enviar(): void {
    if (this.salvando) return;

    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const especie = v.especie.trim();

    if (!nome) return this.setErro('Informe o nome do animal.');
    if (nome.length > 100) return this.setErro('O nome pode ter no máximo 100 caracteres.');
    if (!especie) return this.setErro('Informe a espécie (ex.: Cão, Gato).');
    if (especie.length > 250) return this.setErro('A espécie pode ter no máximo 250 caracteres.');
    if (v.dataAntirrabica && v.dataAntirrabica > this.hoje) {
      return this.setErro('A data da última antirrábica não pode ser futura.');
    }

    this.erro.set(null);
    this.salvar.emit({
      dados: { nome, especie, dataAntirrabica: v.dataAntirrabica || null, maeId: v.maeId },
      precisaInternar: v.precisaInternar,
    });
  }

  private setErro(mensagem: string): void {
    this.erro.set(mensagem);
  }
}
