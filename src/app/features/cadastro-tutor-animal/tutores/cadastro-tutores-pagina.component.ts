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
import { Observable } from 'rxjs';
import { AppShellComponent } from '../../../shared/app-shell/app-shell.component';
import { AuthService } from '../../../core/services/auth.service';
import { AnimalFormularioComponent } from '../animais/animal-formulario/animal-formulario.component';
import { AnimalService } from '../animais/animal.service';
import { Animal, NovoAnimalEvento, OpcaoMae } from '../animais/animal.model';
import { TutorFormularioComponent } from './tutor-formulario/tutor-formulario.component';
import { AnimalDoTutor, TutoresTabelaComponent } from './tutores-tabela/tutores-tabela.component';
import { TutorService } from './tutor.service';
import { DadosTutor, Tutor } from './tutor.model';

/** O que o painel acima da tabela está mostrando. */
type Painel =
  | { tipo: 'novo'; passo: 1 | 2; rascunho: DadosTutor | null }
  | { tipo: 'editarTutor'; tutor: Tutor }
  | { tipo: 'novoAnimal'; tutor: Tutor }
  | { tipo: 'editarAnimal'; tutor: Tutor; animal: Animal };

/** Resultado da última gravação, mostrado no aviso verde acima da tabela. */
interface Sucesso {
  mensagem: string;
  precisaInternar: boolean;
}

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * CadastroTutoresPaginaComponent
 * ------------------------------
 * Componente de ROTA da tela 1, "animais e tutores". Todo animal pertence a um tutor: o cadastro começa pelo
 * tutor (com o primeiro animal, gravados juntos), e cada linha da tabela permite acrescentar outro animal ao
 * tutor, editar o tutor ou editar um animal, inclusive a mãe e a antirrábica.
 */
@Component({
  selector: 'app-cadastro-tutores-pagina',
  standalone: true,
  imports: [AppShellComponent, TutorFormularioComponent, AnimalFormularioComponent, TutoresTabelaComponent],
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
  protected readonly podeCadastrar = computed(() => this.auth.temRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA']));

  protected readonly busca = signal('');
  protected readonly tutoresFiltrados = computed(() => {
    const termo = normalizar(this.busca());
    const lista = [...this.tutores()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (!termo) return lista;
    return lista.filter(
      (t) => normalizar(t.nome).includes(termo) || t.animais.some((a) => normalizar(a.nome).includes(termo)),
    );
  });

  protected readonly nomesAnimais = computed<Record<number, string>>(() =>
    Object.fromEntries(this.tutores().flatMap((t) => t.animais.map((a) => [a.id, a.nome]))),
  );

  /** Qualquer animal já cadastrado pode ser indicado como mãe; o rótulo leva o tutor para diferenciar homônimos. */
  protected readonly opcoesMae = computed<OpcaoMae[]>(() =>
    this.tutores()
      .flatMap((t) => t.animais.map((a) => ({ id: a.id, rotulo: `${a.nome} · ${a.especie} (${t.nome})` })))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR')),
  );

  protected readonly erroLista = signal<string | null>(null);
  protected readonly painel = signal<Painel | null>(null);
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

  protected abrir(painel: Painel): void {
    this.erroForm.set(null);
    this.sucesso.set(null);
    this.salvando.set(false);
    this.painel.set(painel);
  }

  protected novoCadastro(): void {
    this.abrir({ tipo: 'novo', passo: 1, rascunho: null });
  }

  protected editarTutor(tutor: Tutor): void {
    this.abrir({ tipo: 'editarTutor', tutor });
  }

  protected adicionarAnimal(tutor: Tutor): void {
    this.abrir({ tipo: 'novoAnimal', tutor });
  }

  protected editarAnimal({ tutor, animal }: AnimalDoTutor): void {
    this.abrir({ tipo: 'editarAnimal', tutor, animal });
  }

  protected fecharPainel(): void {
    this.painel.set(null);
  }

  /** Passo 1 do cadastro: guarda o tutor e vai para o animal. */
  protected avancar(dados: DadosTutor): void {
    this.erroForm.set(null);
    this.painel.set({ tipo: 'novo', passo: 2, rascunho: dados });
  }

  protected voltarAoTutor(): void {
    const p = this.painel();
    if (p?.tipo === 'novo') {
      this.erroForm.set(null);
      this.painel.set({ ...p, passo: 1 });
    }
  }

  /** Último passo do cadastro: tutor e primeiro animal numa chamada só. */
  protected cadastrar(evento: NovoAnimalEvento): void {
    const p = this.painel();
    if (p?.tipo !== 'novo' || !p.rascunho) return;
    this.gravar(this.tutorService.criar({ ...p.rascunho, animais: [evento.dados] }), (t: Tutor) => ({
      mensagem: `Tutor ${t.nome} e animal ${evento.dados.nome} cadastrados.`,
      precisaInternar: evento.precisaInternar,
    }));
  }

  protected salvarTutor(dados: DadosTutor): void {
    const p = this.painel();
    if (p?.tipo !== 'editarTutor') return;
    this.gravar(this.tutorService.atualizar(p.tutor.id, dados), (t: Tutor) => ({
      mensagem: `Dados de ${t.nome} atualizados.`,
      precisaInternar: false,
    }));
  }

  protected salvarAnimal(evento: NovoAnimalEvento): void {
    const p = this.painel();
    if (p?.tipo === 'novoAnimal') {
      this.gravar(this.animalService.criar(p.tutor.id, evento.dados), (a: Animal) => ({
        mensagem: `${a.nome} cadastrado para ${p.tutor.nome}.`,
        precisaInternar: evento.precisaInternar,
      }));
    } else if (p?.tipo === 'editarAnimal') {
      this.gravar(this.animalService.atualizar(p.animal.id, evento.dados), (a: Animal) => ({
        mensagem: `Dados de ${a.nome} atualizados.`,
        precisaInternar: false,
      }));
    }
  }

  protected irParaInternacao(): void {
    this.router.navigateByUrl('/internacao');
  }

  protected fecharSucesso(): void {
    this.sucesso.set(null);
  }

  private gravar<T>(chamada: Observable<T>, mensagem: (resposta: T) => Sucesso): void {
    if (this.salvando()) return;
    this.salvando.set(true);
    this.erroForm.set(null);
    chamada.subscribe({
      next: (resposta) => {
        this.salvando.set(false);
        this.painel.set(null);
        this.sucesso.set(mensagem(resposta));
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        if (this.sessaoExpirou(e)) return;
        this.erroForm.set(this.tutorService.mensagemDeErro(e));
      },
    });
  }

  private sessaoExpirou(e: HttpErrorResponse): boolean {
    if (e.status !== 401) return false;
    this.auth.logout();
    this.router.navigateByUrl('/login');
    return true;
  }

  private formatarData(data: Date): string {
    const texto = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(data);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
