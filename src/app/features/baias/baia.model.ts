/**
 * Modelos de baia — espelham o contrato do microserviço ms-cadastro-baias
 * (BaiaRequest / BaiaResponse, endpoints em /api/baias).
 *
 * A ocupação (livre/ocupada) ainda não existe no back-end: ela será tratada
 * na internação (Sprint 2). Aqui é só o cadastro.
 */

/** Tipos de baia, exatamente como o enum `Tipo` do back-end. */
export type TipoBaia = 'ISOLAMENTO' | 'COLETIVA' | 'NINHADA';

/** Resposta de GET/POST/PUT/PATCH em /api/baias. */
export interface Baia {
  id: string; // UUID
  tipo: TipoBaia;
  nome: string;
  descricao: string | null;
  capacidade: number;
  ativo: boolean;
}

/** Corpo enviado no POST e no PUT /api/baias. */
export interface DadosBaia {
  tipo: TipoBaia;
  nome: string;
  descricao: string | null;
  capacidade: number;
}

/** Corpo de erro padrão do back-end (ErroResponse). */
export interface ErroApi {
  status: number;
  erro: string;
  mensagem: string;
  path: string;
  campos: Record<string, string> | null;
}

/** Nome do tipo exibido na tela. */
export const NOME_POR_TIPO: Record<TipoBaia, string> = {
  ISOLAMENTO: 'Isolamento',
  COLETIVA: 'Coletiva',
  NINHADA: 'Ninhada',
};

/** Capacidade máxima por tipo (mesma regra do enum `Tipo` do back-end). */
export const CAPACIDADE_MAXIMA: Record<TipoBaia, number> = {
  ISOLAMENTO: 1,
  COLETIVA: 6,
  NINHADA: 6,
};

/** A clínica tem no máximo 12 baias (regra LIMITE_BAIAS do back-end). */
export const LIMITE_BAIAS = 12;
