import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

/**
 * TemaService
 * -----------
 * Guarda e alterna o tema claro/escuro da aplicação inteira.
 * Vive em `core/` porque é global: existe uma única instância
 * (`providedIn: 'root'`) usada por qualquer tela.
 *
 * Só faz uma coisa: liga/desliga a classe `.dark-theme` no <html>.
 * Quem define as cores é o arquivo `src/styles/tema.css`.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  /** true = tema escuro ativo. É um signal, então o template reage sozinho. */
  readonly isDark = signal(false);

  constructor() {
    // Restaura a preferência salva (apenas no browser, não no SSR).
    if (isPlatformBrowser(this.platformId)) {
      this.definirTema(localStorage.getItem('tema') === 'dark');
    }
  }

  toggleTheme(): void {
    this.definirTema(!this.isDark());
  }

  private definirTema(dark: boolean): void {
    this.isDark.set(dark);
    this.document.documentElement.classList.toggle('dark-theme', dark);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('tema', dark ? 'dark' : 'light');
    }
  }
}
