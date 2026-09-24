/**
 * Modelos de medicamento — espelham o contrato do microserviço
 * octopus-msmedications (MedicacaoResponse, endpoints em /api/medicacoes).
 *
 * É o CATÁLOGO de medicamentos da clínica. Prescrição e doses aplicadas
 * nos animais ficam em outros microserviços (Sprints 3 e 4).
 */

/** Numa dose perdida, CONTINUO desloca as seguintes (RN-07) e SINTOMATICO descarta (RN-08). */
export type TipoEsquema = 'CONTINUO' | 'SINTOMATICO';

/** Resumo de um medicamento com o qual a interação é proibida. */
export interface InteracaoProibida {
  id: string;
  nomeComercial: string;
  principioAtivo: string;
}

/** Resposta de GET /api/medicacoes. */
export interface Medicacao {
  id: string; // UUID
  nomeComercial: string;
  principioAtivo: string;
  concentracao: string; // Ex.: "500mg", "10ml"
  formaFarmaceutica: string;
  unidadeMedidaEmbalagem: string; // mg, mL, g
  tipoEsquema: TipoEsquema;
  dataVencimento: string; // LocalDateTime, ex.: "2027-03-01T00:00:00"
  fabricante: string;
  numeroRegistroAnvisa: string;
  ativo: boolean;
  interacoesProibidas: InteracaoProibida[];
}

export const NOME_POR_ESQUEMA: Record<TipoEsquema, string> = {
  CONTINUO: 'Uso contínuo',
  SINTOMATICO: 'Sintomático',
};

/** Corpo de POST /api/medicacoes (MedicacaoRequest no back-end). */
export interface DadosMedicacao {
  nomeComercial: string;
  principioAtivo: string;
  concentracao: string;
  formaFarmaceutica: string;
  unidadeMedidaEmbalagem: string;
  tipoEsquema: TipoEsquema;
  dataVencimento: string; // LocalDateTime sem fuso, ex.: "2027-03-01T00:00:00"
  fabricante: string;
  numeroRegistroAnvisa: string; // exatamente 11 dígitos
  interacoesProibidas: string[]; // ids das medicações
}

/** Corpo de erro do back-end (ErroResponse). */
export interface ErroApi {
  status: number;
  erro: string;
  mensagem: string;
  path: string;
  campos: Record<string, string> | null;
}
