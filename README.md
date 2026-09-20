# ClinicaPet — Front-end

Front-end da clínica veterinária, feito em **Angular 17** com
componentes _standalone_, formulários reativos, rotas com _lazy loading_ e
tema claro/escuro.

Atualmente o projeto tem a **tela de login**, já preparada para crescer
(cadastro de baias, painel de controle, etc.) com controle de permissões.

---

## Como rodar

```bash
npm install
npm start        # ng serve → http://localhost:4200
npm run build    # build de produção
```

---

## Filosofia da arquitetura

O projeto se organiza **por funcionalidade (feature)** e segue quatro ideias:

1. **Componente "esperto" (container) x "burros" (apresentação).**
   O container da rota decide o que fazer; os blocos visuais só exibem
   conteúdo e **emitem eventos**. Nenhum bloco visual conhece a API.

2. **Comunicação por `@Input` / `@Output`.**
   Dados descem por `@Input`; ações sobem por `@Output` (`EventEmitter`).

3. **Estado global em serviços (`core/`).**
   Tema e usuário logado não pertencem a uma tela só — ficam em serviços
   injetáveis, com uma única instância na app inteira.

4. **Três gavetas fixas.** Todo arquivo novo cai em uma delas:
   - **É uma tela/assunto do sistema?** → `features/<nome>/`
   - **É reutilizado em várias telas?** → `shared/`
   - **É serviço/regra global (auth, tema, guardas)?** → `core/`

---

## Estrutura de pastas

```
src/
├── main.ts                    # bootstrap (AppComponent + rotas)
├── index.html
├── styles.css                 # estilos globais — importa styles/tema.css
│
├── styles/
│   └── tema.css               # tokens de tema (variáveis CSS) claro/escuro
│
└── app/
    ├── app.component.ts        # raiz da app: só hospeda <router-outlet/>
    ├── app.config.ts           # providers (router, hydration)
    ├── app.routes.ts           # rotas raiz + lazy loading + guardas
    │
    ├── core/                   # GLOBAL — uma instância, sem tela própria
    │   ├── models/
    │   │   └── usuario.model.ts        # Usuario, Papel
    │   ├── services/
    │   │   ├── auth.service.ts         # login/logout + usuário logado (signal)
    │   │   └── tema.service.ts         # alterna .dark-theme no <html>
    │   └── guards/
    │       ├── auth.guard.ts           # exige estar logado
    │       └── permissao.guard.ts      # exige um papel (ex.: admin)
    │
    ├── shared/                 # REUTILIZÁVEL em várias telas
    │   └── modo-dark/
    │       └── modo-dark.component.*        # botão sol/lua (usa TemaService)
    │
    └── features/               # uma pasta por área do sistema
        └── login/
            ├── login-pagina.component.*     # CONTAINER da rota /login
            ├── login-formulario/
            │   └── login-formulario.component.*   # form e-mail/senha (@Output login)
            └── painel-marca/
                └── painel-marca.component.*       # painel azul (logo/título)
```

### Papel de cada peça

| Camada | Classe (`seletor`) | Responsabilidade |
|--------|--------------------|------------------|
| **Raiz** | `AppComponent` (`app-root`) | Hospeda o `<router-outlet/>`. |
| **Container** | `LoginPaginaComponent` (`app-login-pagina`) | Monta a tela e trata o `(login)`. Único ponto que conhece o `AuthService`. |
| **Apresentação** | `PainelMarcaComponent` (`app-painel-marca`) | Painel azul (logo, título). Textos via `@Input`. Sem lógica. |
| **Apresentação** | `LoginFormularioComponent` (`app-login-formulario`) | Valida e-mail/senha e **emite** `@Output() login`. |
| **Compartilhado** | `ModoDarkComponent` (`app-modo-dark`) | Botão que chama `TemaService.toggleTheme()`. |
| **Serviço** | `AuthService` | Guarda o usuário logado e o papel; expõe `estaLogado`. |
| **Serviço** | `TemaService` | Alterna e persiste o tema; expõe `isDark()`. |
| **Estilo** | `styles/tema.css` | Cores como variáveis CSS para tema claro/escuro. |

---

## Fluxo do login (consumo real da API)

```
Usuário digita e clica "Entrar"
        │
        ▼
LoginFormularioComponent  ──valida──►  @Output() login.emit({ email, senha })
        │
        ▼
LoginPaginaComponent.handleLogin()  ──►  AuthService.login()  ──HTTP POST──►  /api/auth/login
        │                                        │
        │                                        ▼  (sucesso)
        │                               guarda token JWT + usuário (localStorage + signal)
        ▼
carregando()/erro() atualizam o formulário (botão "Entrando...", mensagem de erro)
```

Contrato do back-end (`Bifaniii/Octopus`, microserviço `octopus-msusuario`):

| | |
|---|---|
| **Endpoint** | `POST /api/auth/login` (público) |
| **Request** | `{ email: string, senha: string }` |
| **Response** | `{ token, tipo, expiraEm, email, role }` |
| **role** | `ROLE_ADMIN`, `ROLE_VETERINARIO`, `ROLE_AUXILIAR`, `ROLE_RECEPCIONISTA`, `ROLE_TUTOR` |

A partir do login, o `authInterceptor` anexa `Authorization: Bearer <token>`
em toda requisição — então as próximas telas (baias, animais…) já vão
autenticadas automaticamente.

O tema segue caminho parecido: `ModoDarkComponent` → `TemaService` →
classe `.dark-theme` no `<html>` → cores de `styles/tema.css` reagem.

---

## Configuração da API (proxy de desenvolvimento)

O back-end **não tem CORS configurado**, então em desenvolvimento o
`ng serve` usa um proxy para falar com ele sem erro de CORS:

- `src/environments/environment.ts` → `apiBaseUrl: '/api'` (relativo).
- `proxy.conf.json` → redireciona `/api` para `http://localhost:8080`
  (porta padrão do Spring Boot). Já está ligado no `angular.json`.

Ou seja: **suba o back-end em `localhost:8080`** e rode `npm start`. Se a
API estiver em outra porta/host, ajuste `proxy.conf.json` (dev) ou o
`apiBaseUrl` do environment (produção).

---

## Como adicionar uma nova feature (ex.: cadastro de baia)

1. Crie a pasta `src/app/features/baias/` com o(s) componente(s) da tela.
2. Registre a rota em `app.routes.ts` com _lazy loading_ e as guardas:

```ts
{
  path: 'baias',
  canActivate: [authGuard],                    // precisa estar logado
  loadComponent: () =>
    import('./features/baias/cadastro-baia/cadastro-baia.component')
      .then((m) => m.CadastroBaiaComponent),
},
{
  path: 'painel',
  canActivate: [authGuard, permissaoGuard],    // logado + papel admin
  data: { roles: ['ROLE_ADMIN'] },
  loadComponent: () =>
    import('./features/painel-controle/painel.component')
      .then((m) => m.PainelComponent),
},
```

Repare: proteger uma tela por permissão é **uma linha na rota** — nenhuma
outra tela precisa mudar. Há exemplos prontos comentados no `app.routes.ts`.
