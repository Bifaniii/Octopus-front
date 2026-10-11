import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissaoGuard } from './core/guards/permissao.guard';

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
    path: 'esqueci-senha',
    loadComponent: () =>
      import('./features/login/esqueci-senha-pagina.component').then(
        (m) => m.EsqueciSenhaPaginaComponent,
      ),
  },

  {
    path: 'redefinir-senha',
    loadComponent: () =>
      import('./features/login/redefinir-senha-pagina.component').then(
        (m) => m.RedefinirSenhaPaginaComponent,
      ),
  },

  {
    path: 'baias',
   // canActivate: [authGuard],
    loadComponent: () =>
      import('./features/baias/cadastro-baias-pagina.component').then(
        (m) => m.CadastroBaiasPaginaComponent,
      ),
  },

  {
    path: 'registro-medicamentos',
    // canActivate: [authGuard],
    loadComponent: () =>
      import('./features/medication/medication.component').then(
        (m) => m.MedicationComponent,
      ),
  },

  {
    path: 'usuarios',
    canActivate: [authGuard, permissaoGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () =>
      import('./features/usuarios/cadastro-usuarios-pagina.component').then(
        (m) => m.CadastroUsuariosPaginaComponent,
      ),
  },

  {
  path: 'internacao',
  canActivate: [authGuard, permissaoGuard],
  data: { roles: ['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_VETERINARIO', 'ROLE_AUXILIAR'] },
  loadComponent: () =>
    import('./features/internacao/internacao-pagina.component')
      .then((m) => m.InternacaoPaginaComponent),
},
// ──────────────────────────────────────────────────────────────
  // ROTA DO CADASTRO DE TUTOR E ANIMAL 
  // ──────────────────────────────────────────────────────────────
  {
    path: 'cadastro-tutor-animal',
    // As guardas estão comentadas para você testar livremente
    // canActivate: [authGuard, permissaoGuard],
    // data: { roles: ['ROLE_ADMIN', 'ROLE_RECEPCIONISTA'] },
    loadComponent: () =>
      import('./features/cadastro-tutor-animal/tutores/cadastro-tutores-pagina.component').then(
        (m) => m.CadastroTutoresPaginaComponent
      ),
  },
  
  // ──────────────────────────────────────────────────────────────
  // EXEMPLOS de features futuras — descomente ao criar cada pasta.
  //
  // import { permissaoGuard } from './core/guards/permissao.guard';
  //
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