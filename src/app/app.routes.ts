import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Rotas raiz da aplicação.
 *
 * Cada FEATURE é carregada sob demanda (`loadComponent` / `loadChildren`),
 * então o navegador só baixa o código da tela quando o usuário acessa ela.
 *
 * As guardas `authGuard` (exige login) e `permissaoGuard` (exige papel)
 * ficam em `core/guards/`. Veja abaixo, nos exemplos comentados, o padrão
 * para proteger novas telas (baias, painel de controle, etc.).
 */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login-pagina.component').then(
        (m) => m.LoginPaginaComponent,
      ),
  },

  {
    path: 'registro-medicamentos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/medication/medication.component').then(
        (m) => m.MedicationComponent,
      ),
  },

  // ──────────────────────────────────────────────────────────────
  // EXEMPLOS de features futuras — descomente ao criar cada pasta.
  //
  // import { authGuard } from './core/guards/auth.guard';
  // import { permissaoGuard } from './core/guards/permissao.guard';
  //
  // {
  //   path: 'baias',
  //   canActivate: [authGuard],
  //   data: {roles: ['ROLE']},
  //   loadComponent: () =>
  //     import('./features/baias/cadastro-baia/cadastro-baia.component')
  //       .then((m) => m.CadastroBaiaComponent),
  // },
  // {
  //   path: 'painel',
  //   canActivate: [authGuard, permissaoGuard],
  //   data: { roles: ['ROLE'] },
  //   loadComponent: () =>
  //     import('./features/painel-controle/painel.component')
  //       .then((m) => m.PainelComponent),
  // },
  // ──────────────────────────────────────────────────────────────

  { path: '**', redirectTo: 'login' },
];
