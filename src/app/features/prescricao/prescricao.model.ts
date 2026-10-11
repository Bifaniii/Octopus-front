// Espelha os DTOs do octopus-msprescricao (porta 8084).

// O back de prescrição usa Long em medicacaoId, mas o msmedications usa UUID (decisão pendente da squad).
// O front não converte: manda o id exatamente como veio de GET /api/medicacoes.
export type IdMedicacao = string | number;

export interface ItemPrescricao {
  id: number;
  medicacaoId: IdMedicacao;
  intervaloHoras: number;
  inicio: string; // LocalDateTime sem fuso, ex.: "2026-10-10T08:00:00"
  observacao?: string | null;
}

export interface Prescricao {
  id: number;
  internacaoId: number;
  veterinarioEmail: string;
  observacao?: string | null;
  ativo: boolean;
  criadoEm: string;
  itens: ItemPrescricao[];
}

export interface ItemPrescricaoRequest {
  medicacaoId: IdMedicacao;
  intervaloHoras: number;
  inicio: string;
  observacao?: string;
}

export interface PrescricaoRequest {
  internacaoId: number;
  observacao?: string;
  itens: ItemPrescricaoRequest[];
}

// Dados de outros módulos, usados para mostrar nomes e preencher o modal.
export interface InternacaoOpcao {
  id: number;
  animalNome: string;
  animalEspecie?: string;
  status: string;
}

export interface MedicacaoOpcao {
  id: IdMedicacao;
  nomeComercial: string;
}

// A prescrição só é aceita para internações nestes status (senão o back responde 422).
export const STATUS_QUE_ACEITAM_PRESCRICAO = [
  'ADMITIDA',
  'EM_TRATAMENTO',
  'ISOLAMENTO',
];

export const NOME_DO_STATUS: Record<string, string> = {
  ADMITIDA: 'Admitida',
  EM_TRATAMENTO: 'Em tratamento',
  ISOLAMENTO: 'Isolamento',
};
