# Octopus Front · Plantão VidaPet

![Status](https://img.shields.io/badge/status-conclu%C3%ADdo-brightgreen)
![Angular](https://img.shields.io/badge/Angular-17-DD0031)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6)

Interface web do **Plantão**, o sistema de internação e medicação da clínica veterinária **VidaPet**. Projeto
acadêmico da disciplina **Análise e Projeto de Sistemas II**, da squad Octopus. **O projeto está concluído.**

| | |
| :--- | :--- |
| **Aplicação** | <https://clinicavidapet.vercel.app> (acesso com usuário cadastrado) |
| **Back-end** | [Bifaniii/Octopus](https://github.com/Bifaniii/Octopus): 7 microsserviços Spring Boot |

## Telas

| Tela | Rota | O que faz |
| :--- | :--- | :--- |
| Login e senha | `/login`, `/esqueci-senha`, `/redefinir-senha` | Autenticação e recuperação de senha |
| Usuários | `/usuarios` | Cadastro e gestão dos usuários (somente administrador) |
| Tutores e animais | `/cadastro-tutor-animal` | Cadastro e consulta de tutores e pacientes |
| Baias | `/baias` | Cadastro, ativação e desativação de baias |
| Medicamentos | `/registro-medicamentos` | Catálogo, esquema, interações e estoque |
| Internação | `/internacao` | Admissão, andamento, histórico, alta e resumo de alta |
| Prescrições | `/prescricoes` | Prescrição de medicamentos e PDF |
| Painel de doses | `/painel-doses` | Doses atrasadas, próximas e perdidas, e registro da aplicação |
| Relatórios | `/relatorios` | Relatórios em PDF e XLSX conforme o perfil |

As telas e os botões se adaptam ao perfil logado: administrador, recepcionista, veterinário ou auxiliar. A
interface antecipa as regras para evitar erros, mas **quem garante as regras é o back-end**.

A aplicação também tem tema claro e escuro e menu lateral recolhível.

## Tecnologias

- Angular 17 com componentes _standalone_, signals e o controle de fluxo `@if` / `@for`
- Formulários reativos e rotas com _lazy loading_
- CSS próprio com tokens de tema, Bootstrap Icons e a fonte Atkinson Hyperlegible Next
- Deploy na Vercel

## Como rodar

Pré-requisitos: Node.js 18.13 ou superior (ou 20) e o back-end disponível.

```bash
git clone https://github.com/Bifaniii/Octopus-front.git
cd Octopus-front
npm install
npm start        # http://localhost:4200
```

```bash
npm run build    # build de produção
npm test         # Karma + Jasmine
```

### Conexão com a API

O front chama sempre o caminho relativo `/api`.

- **Em desenvolvimento**, o `proxy.conf.mjs` encaminha cada recurso para o microsserviço correspondente. Sem
  configuração, usa as portas locais de 8080 a 8086.
- Para apontar para outros endereços, copie `.env-example` para `.env` e preencha as variáveis `API_*_URL`.
- **Em produção**, uma função da Vercel (pasta `api/`) faz o mesmo repasse, com as variáveis cadastradas no painel
  do projeto. Nenhum endereço de back-end é versionado.

Reinicie o `npm start` depois de alterar o proxy ou o `.env`.

## Estrutura

```
src/app/
├── core/        # serviços globais, guardas, interceptor e modelos
├── shared/      # componentes e diretivas reutilizados (layout, tema, máscaras e validações)
└── features/    # uma pasta por área do sistema
```

Em cada feature, o componente da rota conversa com os services; os componentes visuais recebem dados por `@Input` e
avisam as ações por `@Output`. O token JWT é anexado às requisições pelo `authInterceptor`, e as rotas são
protegidas pelas guardas `authGuard` e `permissaoGuard`.

As convenções completas estão no [`CLAUDE.md`](CLAUDE.md).
