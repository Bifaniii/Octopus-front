import {
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
import { destacarCampo, limparDestaques } from '../../../../shared/mascaras/campo-invalido';
import { nomeValido } from '../../../../shared/mascaras/validacoes';
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
  private readonly raiz = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

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
    limparDestaques(this.raiz);

    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const especie = v.especie.trim();

    if (!nome) return this.setErro('Informe o nome do animal.', 'nome');
    if (nome.length > 100) return this.setErro('O nome pode ter no máximo 100 caracteres.', 'nome');
    if (!especie) return this.setErro('Informe a espécie (ex.: Cão, Gato).', 'especie');
    if (!nomeValido(especie)) return this.setErro('A espécie precisa ter letras (ex.: Cão, Gato).', 'especie');
    if (especie.length > 250) return this.setErro('A espécie pode ter no máximo 250 caracteres.', 'especie');
    if (v.dataAntirrabica && v.dataAntirrabica > this.hoje) {
      return this.setErro('A data da última antirrábica não pode ser futura.', 'dataAntirrabica');
    }
    if (v.dataAntirrabica && v.dataAntirrabica < '1990-01-01') {
      return this.setErro('A data da última antirrábica parece errada: informe o ano com 4 dígitos.', 'dataAntirrabica');
    }

    this.erro.set(null);
    this.salvar.emit({
      dados: { nome, especie, dataAntirrabica: v.dataAntirrabica || null, maeId: v.maeId },
      precisaInternar: v.precisaInternar,
    });
  }

  private setErro(mensagem: string, campo: string): void {
    this.erro.set(mensagem);
    destacarCampo(this.raiz, campo);
  }
}
