export type TipoBaia = 'padrao' | 'ninhada' | 'coletiva';
export type StatusBaia = 'livre' | 'ocupada';

export interface Baia {
  id: number;
  numero: number;
  tipo: TipoBaia;
  status: StatusBaia;
  /** Linha abaixo do título. Ex.: "Rex · Consulta em andamento" */
  descricao?: string;
  /** Responsável ou observação. Ex.: "Dra. Ana" */
  detalhe?: string;
  /** Hora em que a baia foi ocupada (HH:MM). Preenchida automaticamente. */
  desde?: string;
}

/** Dados que o formulário envia ao cadastrar ou editar uma baia. */
export type DadosBaia = Omit<Baia, 'id' | 'desde'>;

/** Prefixo do título do card. Ex.: "Baia 01" */
export const ROTULO_POR_TIPO: Record<TipoBaia, string> = {
  padrao: 'Baia',
  ninhada: 'Ninhada',
  coletiva: 'Coletiva',
};

/** Nome do tipo no formulário. */
export const NOME_POR_TIPO: Record<TipoBaia, string> = {
  padrao: 'Baia comum',
  ninhada: 'Baia de ninhada',
  coletiva: 'Baia coletiva',
};
