import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NovoAnimalEvento } from '../animal.model';

/**
 * AnimalFormularioComponent
 * -------------------------
 * Formulário do passo 2 (dados do animal e "precisa internar?"). Não conhece serviços: valida e avisa o
 * container por eventos (`salvar`, `voltar`) e recebe de volta o estado da chamada (`salvando`, `erroApi`).
 */
@Component({
  selector: 'app-animal-formulario',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './animal-formulario.component.html',
  styleUrl: './animal-formulario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalFormularioComponent {
  /** Enquanto true, os botões ficam desabilitados. */
  @Input() salvando = false;
  /** Mensagem de erro vinda da API. */
  @Input() erroApi: string | null = null;
  /** false quando o tutor já foi gravado e voltar ao passo 1 não mudaria nada. */
  @Input() podeVoltar = true;

  @Output() salvar = new EventEmitter<NovoAnimalEvento>();
  @Output() voltar = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);

  /** Hoje na hora local (aaaa-MM-dd). Sem toISOString(), que converte para UTC e pode virar o dia. */
  protected readonly hoje = (() => {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  })();

  protected readonly form = this.fb.nonNullable.group({
    nome: [''],
    especie: [''],
    dataUltimaAntirrabica: [''],
    precisaInternar: [false],
  });

  protected readonly erro = signal<string | null>(null);

  protected enviar(): void {
    if (this.salvando) return;

    const v = this.form.getRawValue();
    const nome = v.nome.trim();
    const especie = v.especie.trim();

    if (!nome) return this.setErro('Informe o nome do animal.');
    if (nome.length > 100) return this.setErro('O nome pode ter no máximo 100 caracteres.');
    if (!especie) return this.setErro('Informe a espécie (ex.: Cão, Gato).');
    if (especie.length > 50) return this.setErro('A espécie pode ter no máximo 50 caracteres.');
    if (v.dataUltimaAntirrabica && v.dataUltimaAntirrabica > this.hoje) {
      return this.setErro('A data da última antirrábica não pode ser futura.');
    }

    this.erro.set(null);
    this.salvar.emit({
      dados: {
        nome,
        especie,
        dataUltimaAntirrabica: v.dataUltimaAntirrabica || null,
      },
      precisaInternar: v.precisaInternar,
    });
  }

  private setErro(mensagem: string): void {
    this.erro.set(mensagem);
  }
}
