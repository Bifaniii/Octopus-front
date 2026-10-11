// Espelha os DTOs do octopus-msprescricao (porta 8084). Todos os ids são Long; só os usuários usam UUID.

export interface ItemPrescricao {
  id: number;
  medicacaoId: number;
  dosagem: string;
  intervaloHoras: number;
  quantidadeDoses: number;
  inicio: string; // LocalDateTime sem fuso, ex.: "2026-10-10T08:00:00"
  observacao?: string | null;
  /** Gerados pelo back: inicio + n * intervaloHoras. Cada um vira uma dose no octopus-msdoses. */
  horarios: string[];
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
  medicacaoId: number;
  dosagem: string;
  intervaloHoras: number;
  quantidadeDoses: number;
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
  id: number;
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
