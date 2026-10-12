# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

> Este arquivo é versionado e vale para toda a squad. Não coloque nele valores de `.env`, senhas, tokens nem
> endereços de servidor, só nomes de variáveis. A seção "Estado das branches" é um retrato datado: atualize
> quando mexer numa branch. Última revisão: 11/10/2026 (fechamento da Sprint 2).

## Visão geral

Front-end do **Plantão**, o sistema de medicação e internação da clínica veterinária *VidaPet* (projeto
acadêmico de "Análise e Projeto de Sistemas II", squad Octopus). O back-end são microsserviços Spring Boot no
repositório `Bifaniii/Octopus`, um por branch; as regras de negócio (RN-01 a RN-08), os perfis e o escopo estão
no `TAP.md` e no `CLAUDE.md` de lá. O enunciado do professor (PDF) prevalece sobre o TAP quando divergem.

O front não decide regra de negócio. Ele antecipa as regras para evitar erro previsível (esconder botão, bloquear
opção), mas quem garante é o back; o erro dele sempre é mostrado ao usuário.

Fora do escopo (TAP): notificação push ou e-mail, app mobile, integrações externas e esforço excessivo em design.

## Comandos

```bash
npm install
npm start         # ng serve com proxy → http://localhost:4200
npm run build     # build de produção (SSR + prerender), saída em dist/clinica-pet
npx ng build --configuration development   # build rápido para conferir erros de tipo e de template
npm test          # Karma + Jasmine
```

O `ng serve` não recarrega o `proxy.conf.mjs`: depois de mexer nele, pare e rode `npm start` de novo.

## Stack

Angular 17 com componentes standalone, signals, o novo controle de fluxo nos templates (`@if`, `@for`,
`@switch`), formulários reativos, lazy loading por rota e SSR com prerender (`server.ts`). Ícones do
`bootstrap-icons` (classes `bi bi-*`). Sem biblioteca de componentes: o visual vem de CSS próprio com os tokens
de `src/styles/tema.css`.

## Organização

Três gavetas fixas; todo arquivo novo cai em uma delas:

- `features/<nome>/`: uma pasta por tela (`login`, `baias`, `medication`, `usuarios`, `internacao`,
  `cadastro-tutor-animal`, `prescricao`).
- `shared/`: reutilizado em várias telas (`app-shell` com a sidebar e o cabeçalho, `modo-dark`).
- `core/`: global, uma instância na app inteira: `services` (`AuthService`, `TemaService`), `guards`
  (`authGuard`, `permissaoGuard`), `interceptors` (`authInterceptor`) e `models`.

Dentro de uma feature, o padrão (use `features/baias` como referência):

- `<nome>.model.ts`: interfaces que espelham os DTOs do back (records `*Response` e `*Request`), tipos dos enums
  como union de strings e constantes de exibição (`NOME_POR_TIPO`, `NOME_POR_STATUS`).
- `<nome>.service.ts`: `@Injectable({ providedIn: 'root' })`, consome `${environment.apiBaseUrl}/<recurso>`,
  guarda a lista num `signal` privado exposto com `asReadonly()` e atualiza esse signal depois de cada escrita
  (`tap`). Tem um `mensagemDeErro(e: HttpErrorResponse)` que traduz o status HTTP em texto para a tela.
- Componente de rota (container): o único que injeta services. Monta a tela, controla os diálogos e chama a API.
- Componentes visuais: só `@Input` e `@Output`, `ChangeDetectionStrategy.OnPush`, sem services.

## Convenções

- **SSR:** nada de `localStorage`, `setInterval` ou chamada à API fora do navegador. O componente de rota carrega
  os dados dentro de `if (isPlatformBrowser(inject(PLATFORM_ID)))`; no SSR não há token nem proxy.
- **401:** o container limpa a sessão (`auth.logout()`) e volta para `/login` (método `sessaoExpirou`).
- **Erros do back:** o corpo é o `ErroResponse` (`status`, `erro`, `mensagem`, `path`, `campos`). Para 404, 409 e
  422 mostre a `mensagem`, que já traz o texto da regra (ex.: "RN-01: a baia B-01 está lotada (1/1)."). Para 400
  com `campos`, liste campo e mensagem. 409 de concorrência pede recarregar a lista; 503 e 502 são serviço fora
  do ar, não erro do usuário.
- **Datas:** o back usa `LocalDateTime` sem fuso (`"2026-10-08T22:30:00"`), na hora da clínica. Envie o valor do
  `<input type="datetime-local">` como está e nunca use `toISOString()`, que converte para UTC e desloca 3 horas.
  `new Date(valor)` numa string sem fuso lê como hora local, que é o desejado.
- **Diálogos:** `<dialog>` nativo aberto com `showModal()` no `ngAfterViewInit`; fechar chama `close()`, que
  dispara o evento `close` e emite `fechar`. Não fechar ao clicar fora (decisão já tomada no diálogo de
  usuários).
- **Perfis:** `auth.temRole([...])` para mostrar ou esconder ações, com os mesmos papéis do `@PreAuthorize` do
  back. Esconder botão é conforto, não segurança.
- **Estilo:** só variáveis do `tema.css` (`--color-*`, `--radius-*`, `--shadow-*`), para o tema escuro funcionar
  sozinho. Cada tela usa o `<app-shell titulo subtitulo itemAtivo>` como moldura.

## Rotas e guardas

Em `app.routes.ts`, cada tela é `loadComponent` e as novas entram antes do curinga `{ path: '**' }`, que precisa
ser a última. Rota protegida usa `canActivate: [authGuard, permissaoGuard]` com `data: { roles: [...] }`.
Todas as telas além do login têm guarda. Quem está logado sem o papel exigido volta para `/baias`, e os links da
sidebar só aparecem para quem pode abrir a tela. O link da tela na sidebar fica em
`shared/app-shell/app-shell.component.html` (um `<a routerLink>` por item). A tela de usuários não está na sidebar:
o admin chega nela pelo botão "Criar usuário" do painel de baias.

**Ids.** Todo id é `number` (`Long` no back), menos os de usuário (`id` e `perfilId` em `usuarios`), que são
`string` (UUID). Em `<select>` com id, use `[ngValue]`, e não `[value]`, que transforma o número em texto.

## Proxy e ambientes

O front chama sempre `/api/...` (`environment.apiBaseUrl`) e o proxy escolhe o microsserviço pelo prefixo:

| Prefixo | Variável | Microsserviço |
| :------ | :------- | :------------ |
| `/api/medicacoes` | `API_MEDICACOES_URL` | `octopus-msmedications` (:8082) |
| `/api/baias` | `API_BAIAS_URL` | `ms-cadastro-baias` (:8081) |
| `/api/internacoes` | `API_INTERNACOES_URL` | `ms-internacao` (:8083) |
| `/api/prescricoes` | `API_PRESCRICOES_URL` | `octopus-msprescricao` (:8084) |
| `/api/doses` | `API_DOSES_URL` | `octopus-msdoses` (:8085) |
| `/api/relatorios` | `API_RELATORIOS_URL` | `octopus-msrelatorios` (:8086) |
| `/api` (o resto) | `API_DEFAULT_URL` | `octopus-msusuario` (:8080): login, usuários, tutores, animais |

- Desenvolvimento: `proxy.conf.mjs`, lendo o `.env` da raiz (modelo em `.env-example`). A primeira entrada que
  casa vence, então prefixo específico vem sempre antes do `/api` genérico.
- Produção (Vercel): `api/[...path].js` faz o mesmo papel com as variáveis do painel da Vercel. Módulo novo
  precisa de entrada no array `ROTAS` e da variável criada lá; sem ela, o proxy responde 500 "Proxy sem destino
  configurado".
- Endereço de servidor não vai para o código, nem como valor padrão: fica no `.env` local e no painel da Vercel.

## Telas

- `login`: login, esqueci a senha e redefinição (código de 6 dígitos por e-mail).
- `usuarios` (só `ROLE_ADMIN`): lista de `GET /api/usuarios` com filtros de nome, perfil, situação e período de
  cadastro (aplicados no back ao clicar em "Filtrar"), cadastro de veterinário, auxiliar, recepcionista e admin, e
  desativação em dois cliques (o admin não tem desativação no back). Clicar na linha abre a ficha do usuário
  (`usuario-detalhe`): conta, mais os dados do perfil buscados em `GET /api/<perfil>/{perfilId}` (CPF ou CNPJ,
  nascimento, telefone e, no veterinário, CRMV e especialização). O admin só tem nome e conta. Para o admin, o
  lápis no cabeçalho da ficha abre a edição (`PUT /api/<perfil>/{perfilId}` ou `/api/admins/{perfilId}`), com os
  campos e as regras do cadastro, sem a senha. Trocar o e-mail derruba as sessões abertas daquela conta.
- Senha no cadastro de usuário: mínimo de 8 caracteres, como no back (na redefinição o back aceita 6).
- Textos de tela: sem travessão. Para valor vazio, escreva "Sem registro" ou equivalente.
- `cadastro-tutor-animal` (tela 1; admin e recepção cadastram e editam, o veterinário só consulta): tutores com os seus animais. Todo animal
  tem um tutor e pode ter uma mãe (outro animal já cadastrado, de qualquer tutor). "Novo tutor" é um assistente em
  dois passos (tutor, depois primeiro animal) gravado numa chamada só (`POST /api/tutores` com `animais`). Cada
  linha permite acrescentar animal (`POST /api/tutores/{id}/animais`), editar o tutor (`PUT /api/tutores/{id}`) e
  editar um animal (`PUT /api/animais/{id}`, inclusive mãe e antirrábica). A leitura vem só de `GET /api/tutores`,
  que já traz os animais. A antirrábica vencida aparece destacada, com a mesma conta da RN-02.
- `prescricoes` (tela 5): o veterinário prescreve para uma internação aberta (medicamento, dosagem, intervalo,
  número de doses e início). O card mostra os horários gerados pelo back. Desativar cancela as doses pendentes no
  `octopus-msdoses`.
- `relatorios` (ícone de prancheta na sidebar, todos os perfis): um card por relatório que o perfil pode gerar,
  com os filtros de cada um e os botões PDF e Excel. O arquivo vem pronto de `GET /api/relatorios/<tipo>`; a tela
  baixa o Blob com o nome do `Content-Disposition`. Os perfis de cada relatório estão em `RELATORIOS`
  (`relatorio.model.ts`), espelho do `@PreAuthorize` do msrelatorios. O filtro de auxiliar usa
  `GET /api/usuarios/nomes`. Com `responseType: 'blob'`, o JSON de erro também chega como Blob e é lido antes de
  mostrar a mensagem.
- `baias`: painel de baias por tipo; só o admin cadastra, edita, desativa e reativa (limite de 12 ativas).
- `registro-medicamentos`: cadastro de medicamentos com esquema, interações proibidas e estoque inicial em doses.
  O card mostra o estoque ("Sem estoque" em vermelho quando zera); o lápis ao lado abre o ajuste
  (`PATCH /api/medicacoes/{id}` com `quantidade`), só para admin e veterinário. Reserva e devolução das doses o
  back faz sozinho: prescrever baixa o estoque, e desativar a prescrição ou registrar a saída do animal devolve.
  Sem saldo, a prescrição recebe 422 com a mensagem do back.
- `internacao` (tela 4), com duas abas:
  - "Mapa": baias com ocupação, resumo do plantão e atualização a cada 60 s. Só internações abertas.
  - "Encerradas": tabela das internações que já saíram do mapa, com busca pelo nome do animal (ignora acento e
    maiúscula). Clicar no nome mostra todas as passagens daquele animal (`GET /api/internacoes?animalId=`), e o
    relógio de cada linha abre o mesmo diálogo de histórico do mapa. A encerrada não guarda qual alta teve; o
    termo preenchido identifica a alta a pedido do tutor.
  - `internacao.model.ts` tem a tabela `ACOES` (ação → status de origem e perfis), espelho das transições e do
    `@PreAuthorize` do `ms-internacao`. A chave de cada ação é o próprio caminho do `PATCH /{id}/<acao>`.
  - Diálogos: `admissao-dialogo` (baias em cards, como no painel de baias; bloqueia baia lotada, ninhada sem mãe
    e, com antirrábica vencida, tudo que não é isolamento, mostrando o motivo no card), `acao-dialogo` (pede a baia de isolamento, o termo do tutor ou a hora da saída) e
    `historico-dialogo`.
  - Todos os ids da internação são `number`, inclusive `animalId`, `baiaId` e `maeId`.
  - A lista de animais vem de `GET /api/animais` (`msusuario`), liberado só para admin e recepcionista, os mesmos
    perfis que admitem. O nome do animal no card vem da própria internação.
  - Admitir usa o `GET /api/animais/{id}` do msusuario, já na `main` do back.

## Estado das branches (12/10/2026)

- `main`: tudo da `feature/sprint2-integracao` mais a tela de relatórios (12/10). Em produção, os relatórios
  dependem de `API_RELATORIOS_URL` na Vercel e do msrelatorios publicado.
- `feature/sprint2-integracao`: parte da `main` e junta `feature/internacao` (id numérico),
  `feature/cadastro-tutor-animal` (Miliani) e `feature/prescricao` (Marcos), com os ids numéricos em todas as telas,
  a tela de tutores ligada ao msusuario, os filtros de usuários, a prescrição com dosagem e horários e o proxy
  de `/api/doses`. Em produção depende de `API_PRESCRICOES_URL` e `API_DOSES_URL` na Vercel, além das que já
  existem.
- `feature/internacao`, `feature/cadastro-tutor-animal` e `feature/prescricao`: conteúdo já incluído na
  `feature/sprint2-integracao`.
- `feature/cadastro-baias`, `feature/medication` e `feature/login`: já mescladas na `main`.
- `cadastros-baias`: tem commits que não estão na `main`; conferir com a squad antes de apagar ou mesclar.

## Git

- Uma branch por funcionalidade (`feature/<nome>`), criada a partir da `main` atual.
- Nunca adicionar trailer `Co-Authored-By` nem qualquer trailer extra nos commits.
- Não versionar `.env`, `dist/` nem `.angular/cache` (já estão no `.gitignore`).
