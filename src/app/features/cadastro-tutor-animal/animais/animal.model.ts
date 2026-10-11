/**
 * Modelos de animal — espelham o contrato do octopus-msusuario (AnimalRequest / AnimalResponse).
 *
 * O tutor não vai no corpo: vem da rota (POST /api/tutores/{id}/animais) e não muda na edição
 * (PUT /api/animais/{id}). A mãe é outro animal já cadastrado; o ms-internacao usa ela na RN-01 (ninhada só
 * com filhotes da mesma mãe). O `Animal` de `features/internacao` é uma versão enxuta, só com o que a
 * admissão usa.
 */

/** Resposta de GET/POST/PUT de animal. */
export interface Animal {
  id: number;
  nome: string;
  tutorId: number;
  especie: string;
  dataUltimaAntirrabica: string | null; // aaaa-MM-dd
  maeId: number | null;
}

/** Corpo do POST e do PUT. Atenção ao nome do campo da vacina, que difere do da resposta. */
export interface DadosAnimal {
  nome: string;
  especie: string;
  dataAntirrabica: string | null; // aaaa-MM-dd
  maeId: number | null;
}

/** Opção do campo "mãe": um animal já cadastrado, com o tutor no rótulo para diferenciar homônimos. */
export interface OpcaoMae {
  id: number;
  rotulo: string;
}

/** O que o formulário emite: os dados do animal e, no cadastro, a resposta de "precisa internar?". */
export interface NovoAnimalEvento {
  dados: DadosAnimal;
  /** Só orienta a tela (oferece ir para a internação). Não vai no corpo. */
  precisaInternar: boolean;
}

/** Corpo de erro padrão do back-end (classe ErroResponse). Reaproveitado pela feature `tutores`. */
export interface ErroApi {
  status: number;
  erro: string;
  mensagem: string;
  path: string;
  campos: Record<string, string> | null;
}
