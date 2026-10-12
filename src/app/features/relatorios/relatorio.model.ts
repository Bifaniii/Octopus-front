import { Role } from '../../core/models/usuario.model';

/**
 * Relatórios do octopus-msrelatorios (GET /api/relatorios/<tipo>?formato=PDF|XLSX&filtros).
 * Os perfis de cada um são os mesmos do @PreAuthorize no back, que por sua vez seguem quem lê
 * aqueles dados no sistema.
 */
export type TipoRelatorio = 'doses' | 'internacoes' | 'tutores-animais' | 'baias' | 'usuarios';
export type FormatoRelatorio = 'PDF' | 'XLSX';

export interface DefinicaoRelatorio {
  tipo: TipoRelatorio;
  titulo: string;
  descricao: string;
  icone: string;
  roles: Role[];
}

const TODOS: Role[] = ['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_VETERINARIO', 'ROLE_AUXILIAR'];

export const RELATORIOS: DefinicaoRelatorio[] = [
  {
    tipo: 'doses',
    titulo: 'Doses',
    descricao: 'Aplicadas, atrasadas e perdidas, por turno e por auxiliar.',
    icone: 'bi-capsule-pill',
    roles: TODOS,
  },
  {
    tipo: 'internacoes',
    titulo: 'Internações',
    descricao: 'Animal, tutor, baia, situação e datas de admissão, alta e saída.',
    icone: 'bi-hospital',
    roles: ['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_VETERINARIO'],
  },
  {
    tipo: 'tutores-animais',
    titulo: 'Tutores e animais',
    descricao: 'Contato dos tutores, animais, mães e situação da antirrábica.',
    icone: 'bi-people',
    roles: ['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_VETERINARIO'],
  },
  {
    tipo: 'baias',
    titulo: 'Ocupação de baias',
    descricao: 'Capacidade, vagas livres e quem está internado em cada baia agora.',
    icone: 'bi-grid-3x3-gap',
    roles: TODOS,
  },
  {
    tipo: 'usuarios',
    titulo: 'Usuários',
    descricao: 'Contas do sistema por perfil e situação.',
    icone: 'bi-person-badge',
    roles: ['ROLE_ADMIN'],
  },
];

/** Filtros de todos os relatórios; cada card usa só os seus. Vazio = sem filtro. */
export interface FiltrosRelatorio {
  de: string;
  ate: string;
  turno: string;
  situacao: string;
  auxiliar: string;
  status: string;
  perfil: string;
  ativo: string;
}

export const FILTROS_VAZIOS: FiltrosRelatorio = {
  de: '',
  ate: '',
  turno: '',
  situacao: '',
  auxiliar: '',
  status: '',
  perfil: '',
  ativo: '',
};

/** Quais filtros vão na query de cada relatório. */
export const FILTROS_POR_TIPO: Record<TipoRelatorio, (keyof FiltrosRelatorio)[]> = {
  doses: ['de', 'ate', 'turno', 'situacao', 'auxiliar'],
  internacoes: ['de', 'ate', 'status'],
  'tutores-animais': [],
  baias: [],
  usuarios: ['perfil', 'ativo'],
};

export const TURNOS = [
  { valor: 'MANHA', nome: 'Manhã (06h às 12h)' },
  { valor: 'TARDE', nome: 'Tarde (12h às 18h)' },
  { valor: 'NOITE', nome: 'Noite (18h às 06h)' },
];

export const SITUACOES_DOSE = [
  { valor: 'APLICADA', nome: 'Aplicada' },
  { valor: 'ATRASADA', nome: 'Atrasada' },
  { valor: 'PERDIDA', nome: 'Perdida' },
  { valor: 'PREVISTA', nome: 'Prevista' },
  { valor: 'CANCELADA', nome: 'Cancelada' },
];

export const STATUS_INTERNACAO = [
  { valor: 'ADMITIDA', nome: 'Admitida' },
  { valor: 'EM_TRATAMENTO', nome: 'Em tratamento' },
  { valor: 'ISOLAMENTO', nome: 'Isolamento' },
  { valor: 'ALTA_AUTORIZADA', nome: 'Alta autorizada' },
  { valor: 'ALTA_A_PEDIDO_DO_TUTOR', nome: 'Alta a pedido do tutor' },
  { valor: 'ENCERRADA', nome: 'Encerrada' },
];

export const PERFIS = [
  { valor: 'ROLE_ADMIN', nome: 'Administrador' },
  { valor: 'ROLE_VETERINARIO', nome: 'Veterinário' },
  { valor: 'ROLE_RECEPCIONISTA', nome: 'Recepcionista' },
  { valor: 'ROLE_AUXILIAR', nome: 'Auxiliar' },
];

/** GET /api/usuarios/nomes do msusuario. */
export interface PessoaResumo {
  email: string;
  nome: string;
  role: Role;
}
