// Espelha os DTOs do octopus-msdoses (porta 8085). Todos os ids são Long.

export type StatusDose = 'PENDENTE' | 'APLICADA' | 'CANCELADA' | 'PERDIDA';
export type TipoEsquema = 'CONTINUO' | 'SINTOMATICO';

export interface Dose {
  id: number;
  prescricaoId: number;
  itemPrescricaoId: number;
  internacaoId: number;
  medicacaoId: number;
  esquema: TipoEsquema;
  seNecessario: boolean;
  /** RN-07: id da dose perdida que esta reaplica. */
  reaplicacaoDe: number | null;
  horarioPrevisto: string; // LocalDateTime sem fuso, hora da clínica
  /** RN-03: a aplicação vale de janelaInicio a janelaFim (30 min antes e depois). */
  janelaInicio: string | null;
  janelaFim: string | null;
  status: StatusDose;
  aplicadaEm: string | null;
  aplicadaPor: string | null;
  observacao: string | null;
}

/** Item "se necessário" (mudança contratada de 01/11): sem horário fixo, com intervalo mínimo. */
export interface ItemSeNecessario {
  itemPrescricaoId: number;
  prescricaoId: number;
  internacaoId: number;
  medicacaoId: number;
  intervaloMinimoHoras: number;
  ativo: boolean;
  ultimaAplicacao: string | null;
  ultimaAplicacaoPor: string | null;
  /** A partir de quando a próxima aplicação é aceita; null se nunca foi aplicado. */
  liberadoEm: string | null;
  liberado: boolean;
}

/** GET /api/doses/painel. `agora` é a hora da clínica no servidor. */
export interface Painel {
  agora: string;
  atrasadas: Dose[];
  proximas: Dose[];
  perdidas: Dose[];
  seNecessario: ItemSeNecessario[];
}

/** O que o diálogo de aplicação precisa mostrar, seja dose com horário ou item "se necessário". */
export interface AlvoAplicacao {
  tipo: 'dose' | 'se-necessario';
  id: number; // id da dose ou do item da prescrição
  animal: string;
  medicamento: string;
  detalhe: string;
}

export const NOME_DO_ESQUEMA: Record<TipoEsquema, string> = {
  CONTINUO: 'Contínuo',
  SINTOMATICO: 'Sintomático',
};
