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

/** Linha normalizada da tabela da tela (um formato só, pros 4 papéis). */
export interface UsuarioListagem {
  id: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
}

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
