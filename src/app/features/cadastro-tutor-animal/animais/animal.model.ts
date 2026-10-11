/**
 * Modelos de animal — espelham o contrato do octopus-msusuario (/api/animais).
 *
 * ATENÇÃO: o `Animal` de `features/internacao/internacao.model.ts` é outro, mais enxuto (só o que a admissão
 * usa). Os dois ficam duplicados até a branch `feature/internacao` ser mesclada; depois unifique aqui.
 *
 * Os campos de escrita (`DadosAnimal`) são o que a tela precisa; confira com o `AnimalRequest` do back
 * antes de ligar na API.
 */

/** Resposta de GET/POST em /api/animais. */
export interface Animal {
  id: string; // UUID
  nome: string;
  especie: string;
  dataUltimaAntirrabica: string | null; // aaaa-MM-dd
  tutorId?: string;
}

/** Corpo do POST /api/animais. */
export interface DadosAnimal {
  nome: string;
  especie: string;
  dataUltimaAntirrabica: string | null; // aaaa-MM-dd
  tutorId: string;
}

/** O que o formulário do passo 2 emite: os dados do animal (sem tutor) e a resposta de "precisa internar?". */
export interface NovoAnimalEvento {
  dados: Omit<DadosAnimal, 'tutorId'>;
  /** Só orienta a tela (oferece ir para a internação). Não vai no corpo do POST. */
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
