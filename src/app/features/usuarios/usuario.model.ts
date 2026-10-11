import { Role } from '../../core/models/usuario.model';

/**
 * Modelos da tela de usuários — espelham o contrato real do back-end
 * (octopus-msusuario). Diferente do que o nome sugere, NÃO existe um
 * único endpoint "criar usuário": cada papel tem seu próprio endpoint
 * e seus próprios campos. "role" não é um campo do corpo — é
 * consequência de qual endpoint você chama.
 *
 *   POST /api/admins         { email, senha, nome }
 *   POST /api/veterinarios   { email, senha, nome, cpfCnpj, tipoPessoa,
 *                               dataNascimento, telefone, crmv, crmvUf,
 *                               especializacao? }
 *   POST /api/auxiliares     { email, senha, nome, cpf, dataNascimento, telefone }
 *   POST /api/recepcionistas { email, senha, nome, cpf, dataNascimento, telefone }
 *
 * Tutor (cliente, sem login/senha) fica de fora desta tela — é outro
 * conceito no back-end (sem UsuarioResponse associado).
 */

/** Papéis que esta tela sabe cadastrar (todos exigem ROLE_ADMIN no back-end). */
export type RoleCriavel = 'ROLE_ADMIN' | 'ROLE_VETERINARIO' | 'ROLE_AUXILIAR' | 'ROLE_RECEPCIONISTA';

export type TipoPessoa = 'PF' | 'PJ';

export type Especializacao =
  | 'GERAL'
  | 'CIRURGIA'
  | 'DERMATOLOGIA'
  | 'ORTOPEDIA'
  | 'CARDIOLOGIA'
  | 'ODONTOLOGIA';

/** Corpo de POST /api/admins */
export interface DadosAdmin {
  email: string;
  senha: string;
  nome: string;
}

/** Corpo de POST /api/veterinarios */
export interface DadosVeterinario {
  email: string;
  senha: string;
  nome: string;
  cpfCnpj: string;
  tipoPessoa: TipoPessoa;
  dataNascimento: string; // aaaa-MM-dd
  telefone: string;
  crmv: string;
  crmvUf: string;
  especializacao: Especializacao | null;
}

/** Corpo de POST /api/auxiliares e POST /api/recepcionistas (mesmo formato). */
export interface DadosAuxiliarOuRecepcionista {
  email: string;
  senha: string;
  nome: string;
  cpf: string;
  dataNascimento: string; // aaaa-MM-dd
  telefone: string;
}

/** Sub-objeto presente em toda resposta de usuário com conta (não existe para Tutor). */
export interface UsuarioResponse {
  id: string;
  email: string;
  role: Role;
  ativo: boolean;
  criadoEm: string;
}

export interface AdminResponse {
  id: string;
  nome: string;
  usuario: UsuarioResponse;
}

export interface VeterinarioResponse {
  id: string;
  nome: string;
  cpfCnpj: string;
  tipoPessoa: TipoPessoa;
  dataNascimento: string;
  telefone: string;
  crmv: string;
  crmvUf: string;
  especializacao: Especializacao;
  usuario: UsuarioResponse;
}

export interface AuxiliarOuRecepcionistaResponse {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  usuario: UsuarioResponse;
}

/**
 * Linha da tabela: resposta de GET /api/usuarios (UsuarioResumoResponse). `id` é a conta e `perfilId` o
 * registro do perfil, que é o id usado em /api/<perfil>/{id}/desativar.
 */
export interface UsuarioListagem {
  id: string;
  perfilId: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
  criadoEm: string;
}

/** Filtros de GET /api/usuarios. Vazio = não filtra. Datas em aaaa-MM-dd, comparadas com a data de cadastro. */
export interface FiltrosUsuario {
  nome: string;
  perfil: RoleCriavel | '';
  situacao: 'ativos' | 'inativos' | '';
  cadastradoDe: string;
  cadastradoAte: string;
}

export const FILTROS_VAZIOS: FiltrosUsuario = { nome: '', perfil: '', situacao: '', cadastradoDe: '', cadastradoAte: '' };

/** Corpos dos PUT de edição: os mesmos campos do cadastro, sem a senha. */
export type EdicaoAdmin = Omit<DadosAdmin, 'senha'>;
export type EdicaoVeterinario = Omit<DadosVeterinario, 'senha'>;
export type EdicaoAuxiliarOuRecepcionista = Omit<DadosAuxiliarOuRecepcionista, 'senha'>;

/** Evento emitido pela ficha ao salvar a edição; o papel diz qual endpoint chamar. */
export type EdicaoUsuarioEvento =
  | { role: 'ROLE_ADMIN'; dados: EdicaoAdmin }
  | { role: 'ROLE_VETERINARIO'; dados: EdicaoVeterinario }
  | { role: 'ROLE_AUXILIAR' | 'ROLE_RECEPCIONISTA'; dados: EdicaoAuxiliarOuRecepcionista };

/** Dados completos do perfil, de GET /api/<perfil>/{id}. O admin não tem esse endpoint nem dados além do nome. */
export type DetalheUsuario = VeterinarioResponse | AuxiliarOuRecepcionistaResponse;

/**
 * Recurso REST de cada perfil com detalhe e desativação (GET /{id} e PATCH /{id}/desativar). O admin não tem
 * nenhum dos dois no back.
 */
export const RECURSO_POR_PERFIL: Partial<Record<RoleCriavel, string>> = {
  ROLE_VETERINARIO: 'veterinarios',
  ROLE_AUXILIAR: 'auxiliares',
  ROLE_RECEPCIONISTA: 'recepcionistas',
};

/** Evento emitido pelo diálogo — o papel escolhido já diz qual formato `dados` tem. */
export type NovoUsuarioEvento =
  | { role: 'ROLE_ADMIN'; dados: DadosAdmin }
  | { role: 'ROLE_VETERINARIO'; dados: DadosVeterinario }
  | { role: 'ROLE_AUXILIAR'; dados: DadosAuxiliarOuRecepcionista }
  | { role: 'ROLE_RECEPCIONISTA'; dados: DadosAuxiliarOuRecepcionista };

/** Corpo de erro padrão do back-end (classe ErroResponse). */
export interface ErroApi {
  timestamp: string;
  status: number;
  erro: string;
  mensagem: string;
  path: string;
  campos: Record<string, string> | null;
}

/** Nome do papel exibido na tela. */
export const NOME_POR_ROLE: Record<RoleCriavel, string> = {
  ROLE_ADMIN: 'Administrador',
  ROLE_VETERINARIO: 'Veterinário',
  ROLE_AUXILIAR: 'Auxiliar',
  ROLE_RECEPCIONISTA: 'Recepcionista',
};

export const NOME_POR_ESPECIALIZACAO: Record<Especializacao, string> = {
  GERAL: 'Geral',
  CIRURGIA: 'Cirurgia',
  DERMATOLOGIA: 'Dermatologia',
  ORTOPEDIA: 'Ortopedia',
  CARDIOLOGIA: 'Cardiologia',
  ODONTOLOGIA: 'Odontologia',
};
