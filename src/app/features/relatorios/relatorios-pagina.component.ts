import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { RelatorioService } from './relatorio.service';
import {
  FILTROS_VAZIOS,
  FiltrosRelatorio,
  FormatoRelatorio,
  PERFIS,
  PessoaResumo,
  RELATORIOS,
  SITUACOES_DOSE,
  STATUS_INTERNACAO,
  TURNOS,
  TipoRelatorio,
} from './relatorio.model';

/**
 * RelatoriosPaginaComponent
 * -------------------------
 * Um card por relatório que o perfil logado pode gerar, cada um com os seus filtros e os botões de PDF e
 * Excel. O arquivo é montado no octopus-msrelatorios; a tela só pede e baixa.
 */
@Component({
  selector: 'app-relatorios-pagina',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './relatorios-pagina.component.html',
  styleUrl: './relatorios-pagina.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatoriosPaginaComponent {
  private readonly relatorioService = inject(RelatorioService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly relatorios = RELATORIOS.filter((r) => this.auth.temRole(r.roles));
  protected readonly turnos = TURNOS;
  protected readonly situacoesDose = SITUACOES_DOSE;
  protected readonly statusInternacao = STATUS_INTERNACAO;
  protected readonly perfis = PERFIS;

  protected readonly filtros = signal<Record<TipoRelatorio, FiltrosRelatorio>>(this.filtrosIniciais());
  protected readonly auxiliares = signal<PessoaResumo[]>([]);
  /** "doses-PDF" enquanto aquele arquivo está sendo gerado. */
  protected readonly gerando = signal<string | null>(null);
  protected readonly erros = signal<Partial<Record<TipoRelatorio, string>>>({});

  constructor() {
    // Só no navegador: no SSR não há token (localStorage) nem proxy para /api.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.relatorioService.auxiliares().subscribe({
        next: (lista) => this.auxiliares.set(lista),
        // Sem a lista, o relatório de doses ainda sai; só o filtro por auxiliar fica vazio.
        error: () => this.auxiliares.set([]),
      });
    }
  }

  protected alterar(tipo: TipoRelatorio, campo: keyof FiltrosRelatorio, valor: string): void {
    this.filtros.update((f) => ({ ...f, [tipo]: { ...f[tipo], [campo]: valor } }));
  }

  protected gerar(tipo: TipoRelatorio, formato: FormatoRelatorio): void {
    const f = this.filtros()[tipo];
    if (f.de && f.ate && f.de > f.ate) {
      this.definirErro(tipo, 'A data inicial não pode ser depois da final.');
      return;
    }
    this.definirErro(tipo, null);
    this.gerando.set(`${tipo}-${formato}`);
    this.relatorioService.gerar(tipo, formato, f).subscribe({
      next: (arquivo) => {
        this.gerando.set(null);
        this.relatorioService.baixar(arquivo);
      },
      error: async (e: HttpErrorResponse) => {
        this.gerando.set(null);
        if (e.status === 401) {
          this.auth.logout();
          this.router.navigateByUrl('/login');
          return;
        }
        this.definirErro(tipo, await this.relatorioService.mensagemDeErro(e));
      },
    });
  }

  protected estaGerando(tipo: TipoRelatorio, formato: FormatoRelatorio): boolean {
    return this.gerando() === `${tipo}-${formato}`;
  }

  private definirErro(tipo: TipoRelatorio, mensagem: string | null): void {
    this.erros.update((e) => {
      const copia = { ...e };
      if (mensagem) copia[tipo] = mensagem;
      else delete copia[tipo];
      return copia;
    });
  }

  /** Doses começam no dia de hoje, que é o padrão do back quando não vem período. */
  private filtrosIniciais(): Record<TipoRelatorio, FiltrosRelatorio> {
    const agora = new Date();
    const hoje = [
      agora.getFullYear(),
      String(agora.getMonth() + 1).padStart(2, '0'),
      String(agora.getDate()).padStart(2, '0'),
    ].join('-');
    return {
      doses: { ...FILTROS_VAZIOS, de: hoje, ate: hoje },
      internacoes: { ...FILTROS_VAZIOS },
      'tutores-animais': { ...FILTROS_VAZIOS },
      baias: { ...FILTROS_VAZIOS },
      usuarios: { ...FILTROS_VAZIOS },
    };
  }
}
