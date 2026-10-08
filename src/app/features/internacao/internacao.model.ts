/**
 * Modelos de internação — espelham o contrato do microsserviço ms-internacao
 * (InternacaoResponse / InternacaoEventoResponse e os requests, endpoints em /api/internacoes).
 */
import { Role } from '../../core/models/usuario.model';

/** Status exatamente como o enum StatusInternacao do ms-internacao. */
export type StatusInternacao =
  | 'ADMITIDA'
  | 'EM_TRATAMENTO'
  | 'ISOLAMENTO'
  | 'ALTA_AUTORIZADA'
  | 'ALTA_A_PEDIDO_DO_TUTOR'
  | 'ENCERRADA';

/** Resposta de GET/POST/PATCH em /api/internacoes. Datas são LocalDateTime, sem fuso: "2026-10-08T10:00:00". */
export interface Internacao {
  id: string;
  animalId: string;
  animalNome: string;
  animalEspecie: string;
  baiaId: string;
  maeId: string | null;
  status: StatusInternacao;
  motivo: string;
  termoResponsabilidade: string | null;
  dataAdmissao: string;
  dataAlta: string | null;
  dataSaida: string | null;
  registradoPor: string;
}

/** Resposta de GET /api/internacoes/{id}/eventos: uma linha por mudança de status ou de baia. */
export interface InternacaoEvento {
  statusAnterior: StatusInternacao | null;
  statusNovo: StatusInternacao;
  baiaId: string;
  usuario: string;
  dataHora: string;
}

/** Corpo do POST /api/internacoes. */
export interface DadosAdmissao {
  animalId: string;
  baiaId: string;
  motivo: string;
}

/** Animal como o GET /api/animais do msusuario devolve (só os campos usados aqui). */
export interface Animal {
  id: string;
  nome: string;
  especie: string;
  dataUltimaAntirrabica: string | null;
  maeId?: string | null;
}

export const NOME_POR_STATUS: Record<StatusInternacao, string> = {
  ADMITIDA: 'Admitida',
  EM_TRATAMENTO: 'Em tratamento',
  ISOLAMENTO: 'Isolamento',
  ALTA_AUTORIZADA: 'Alta autorizada',
  ALTA_A_PEDIDO_DO_TUTOR: 'Alta a pedido do tutor',
  ENCERRADA: 'Encerrada',
};

/** RN-08: a baia fica ocupada até a internação ser encerrada (mesma regra do back). */
export const ocupaBaia = (s: StatusInternacao): boolean => s !== 'ENCERRADA';

/**
 * Ações do ciclo de vida. A chave é o próprio caminho do endpoint (PATCH /api/internacoes/{id}/<acao>).
 * `de` e `roles` espelham a tabela de transições e os @PreAuthorize do back: aqui servem só para mostrar
 * os botões certos. Quem garante a regra é o back.
 */
export type Acao = 'iniciar-tratamento' | 'isolar' | 'autorizar-alta' | 'alta-a-pedido-do-tutor' | 'encerrar';

export interface DefinicaoAcao {
  rotulo: string;
  icone: string;
  de: StatusInternacao[];
  roles: Role[];
}

export const ACOES: Record<Acao, DefinicaoAcao> = {
  'iniciar-tratamento': {
    rotulo: 'Iniciar tratamento',
    icone: 'bi-play-circle',
    de: ['ADMITIDA'],
    roles: ['ROLE_VETERINARIO'],
  },
  isolar: {
    rotulo: 'Isolar',
    icone: 'bi-shield-exclamation',
    de: ['EM_TRATAMENTO'],
    roles: ['ROLE_VETERINARIO'],
  },
  'autorizar-alta': {
    rotulo: 'Autorizar alta',
    icone: 'bi-check2-circle',
    de: ['EM_TRATAMENTO', 'ISOLAMENTO'],
    roles: ['ROLE_VETERINARIO'],
  },
  'alta-a-pedido-do-tutor': {
    rotulo: 'Alta a pedido do tutor',
    icone: 'bi-file-earmark-text',
    de: ['EM_TRATAMENTO', 'ISOLAMENTO'],
    roles: ['ROLE_RECEPCIONISTA', 'ROLE_VETERINARIO'],
  },
  encerrar: {
    rotulo: 'Registrar saída',
    icone: 'bi-box-arrow-right',
    de: ['ALTA_AUTORIZADA', 'ALTA_A_PEDIDO_DO_TUTOR'],
    roles: ['ROLE_RECEPCIONISTA', 'ROLE_VETERINARIO'],
  },
};

/** Ações que o usuário com `role` pode fazer numa internação com `status`. */
export function acoesPara(status: StatusInternacao, role: Role | undefined): Acao[] {
  if (!role) return [];
  return (Object.keys(ACOES) as Acao[]).filter(
    (acao) => ACOES[acao].de.includes(status) && ACOES[acao].roles.includes(role),
  );
}

/**
 * RN-02, mesma conta do back: vencida = sem registro ou aplicada há mais de 12 meses
 * (com exatamente 12 meses ainda vale). Usada só para filtrar as baias no formulário.
 */
export function antirrabicaVencida(data: string | null, hoje = new Date()): boolean {
  if (!data) return true;
  const [ano, mes, dia] = data.split('-').map(Number);
  const validade = new Date(ano, mes - 1 + 12, dia);
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return validade < inicioDeHoje;
}

/** "2026-10-08T10:00:00" → "08/10 10:00". A string não tem fuso: é lida como hora local (a da clínica). */
export function formatarDataHora(valor: string | null): string {
  if (!valor) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(valor));
}

/**
 * Agora no formato do <input type="datetime-local"> ("2026-10-08T22:30"), na hora local.
 * Não usar toISOString(): ele converte para UTC e a saída das 22h chegaria ao back como 01h.
 */
export function agoraLocal(): string {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`;
}
