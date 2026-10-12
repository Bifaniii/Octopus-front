/**
 * Modelos de medicamento — espelham o contrato do microserviço
 * octopus-msmedications (MedicacaoResponse, endpoints em /api/medicacoes).
 *
 * É o CATÁLOGO de medicamentos da clínica, com o estoque em doses: cada dose
 * agendada numa prescrição separa 1 unidade, e a dose cancelada (prescrição
 * desativada ou saída do animal) devolve.
 */

/** Numa dose perdida, CONTINUO desloca as seguintes (RN-07) e SINTOMATICO descarta (RN-08). */
export type TipoEsquema = 'CONTINUO' | 'SINTOMATICO';

/** Resumo de um medicamento com o qual a interação é proibida. */
export interface InteracaoProibida {
  id: number;
  nomeComercial: string;
  principioAtivo: string;
}

/** Resposta de GET /api/medicacoes. */
export interface Medicacao {
  id: number;
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
  quantidade: number; // estoque em doses
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
  interacoesProibidas: number[]; // ids das medicações
  quantidade: number; // estoque inicial em doses
}

/** Corpo de erro do back-end (ErroResponse). */
export interface ErroApi {
  status: number;
  erro: string;
  mensagem: string;
  path: string;
  campos: Record<string, string> | null;
}
