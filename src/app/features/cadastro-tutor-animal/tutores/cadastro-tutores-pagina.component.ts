import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, of, switchMap, tap } from 'rxjs';
import { AppShellComponent } from '../../../shared/app-shell/app-shell.component';
import { AuthService } from '../../../core/services/auth.service';
import { AnimalFormularioComponent } from '../animais/animal-formulario/animal-formulario.component';
import { AnimalService } from '../animais/animal.service';
import { NovoAnimalEvento } from '../animais/animal.model';
import { TutorFormularioComponent } from './tutor-formulario/tutor-formulario.component';
import { TutoresTabelaComponent } from './tutores-tabela/tutores-tabela.component';
import { TutorService } from './tutor.service';
import { DadosTutor, Tutor } from './tutor.model';

/** Resultado do último cadastro, mostrado no aviso verde acima da tabela. */
interface Sucesso {
  tutor: string;
  animal: string;
  precisaInternar: boolean;
}

/**
 * CadastroTutoresPaginaComponent
 * ------------------------------
 * Componente de ROTA da tela "animais e tutores" (uma tela só).
 */
@Component({
  selector: 'app-cadastro-tutores-pagina',
  standalone: true,
  imports: [
    AppShellComponent,
    TutorFormularioComponent,
    AnimalFormularioComponent,
    TutoresTabelaComponent,
  ],
  templateUrl: './cadastro-tutores-pagina.component.html',
  styleUrl: './cadastro-tutores-pagina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastroTutoresPaginaComponent {
  private readonly tutorService = inject(TutorService);
  private readonly animalService = inject(AnimalService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly tutores = this.tutorService.tutores;
  protected readonly carregando = this.tutorService.carregando;
  protected readonly dataHoje = this.formatarData(new Date());

  /** Mesmos perfis do back-end para tutores e animais: ADMIN e RECEPCIONISTA. */
  protected readonly podeCadastrar = computed(() =>
    this.auth.temRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA']),
  );

  /** Erro ao carregar a lista. */
  protected readonly erroLista = signal<string | null>(null);

  protected readonly formAberto = signal(false);
  protected readonly passo = signal<1 | 2>(1);
  /** Dados do passo 1, guardados enquanto o usuário preenche o passo 2. */
  protected readonly rascunhoTutor = signal<DadosTutor | null>(null);
  /** Tutor já gravado nesta tentativa (o animal falhou e o usuário tenta de novo). */
  protected readonly tutorCriado = signal<Tutor | null>(null);
  protected readonly salvando = signal(false);
  protected readonly erroForm = signal<string | null>(null);
  protected readonly sucesso = signal<Sucesso | null>(null);

  constructor() {
    // Só no navegador: no SSR não há token (localStorage) nem proxy para /api.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.recarregar();
    }
  }

  protected recarregar(): void {
    this.erroLista.set(null);
    this.tutorService.carregar().subscribe({
      error: (e: HttpErrorResponse) => {
        if (this.sessaoExpirou(e)) return;
        this.erroLista.set(this.tutorService.mensagemDeErro(e));
      },
    });
  }

  protected novoCadastro(): void {
    this.rascunhoTutor.set(null);
    this.tutorCriado.set(null);
    this.erroForm.set(null);
    this.sucesso.set(null);
    this.passo.set(1);
    this.formAberto.set(true);
  }

  protected cancelar(): void {
    this.formAberto.set(false);
  }

  protected avancar(dados: DadosTutor): void {
    this.rascunhoTutor.set(dados);
    this.erroForm.set(null);
    this.passo.set(2);
  }

  protected voltar(): void {
    this.erroForm.set(null);
    this.passo.set(1);
  }

  protected salvar(evento: NovoAnimalEvento): void {
    const rascunho = this.rascunhoTutor();
    if (!rascunho || this.salvando()) return;

    this.salvando.set(true);
    this.erroForm.set(null);

    const jaCriado = this.tutorCriado();
    const tutor$ = jaCriado
      ? of(jaCriado)
      : this.tutorService.criar(rascunho).pipe(tap((t) => this.tutorCriado.set(t)));

    tutor$
      .pipe(
        switchMap((tutor) =>
          this.animalService
            .criar({ ...evento.dados, tutorId: tutor.id })
            .pipe(map((animal) => ({ tutor, animal }))),
        ),
      )
      .subscribe({
        next: ({ tutor, animal }) => {
          this.salvando.set(false);
          this.formAberto.set(false);
          this.sucesso.set({
            tutor: tutor.nome,
            animal: animal.nome,
            precisaInternar: evento.precisaInternar,
          });
        },
        error: (e: HttpErrorResponse) => {
          this.salvando.set(false);
          if (this.sessaoExpirou(e)) return;
          this.erroForm.set(
            this.tutorCriado()
              ? `O tutor foi cadastrado, mas o animal não: ${this.animalService.mensagemDeErro(e)}`
              : this.tutorService.mensagemDeErro(e),
          );
        },
      });
  }

  protected irParaInternacao(): void {
    this.router.navigateByUrl('/internacao');
  }

  protected fecharSucesso(): void {
    this.sucesso.set(null);
  }

  private sessaoExpirou(e: HttpErrorResponse): boolean {
    if (e.status !== 401) return false;
    this.auth.logout();
    this.router.navigateByUrl('/login');
    return true;
  }

  private formatarData(data: Date): string {
    const texto = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(data);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}