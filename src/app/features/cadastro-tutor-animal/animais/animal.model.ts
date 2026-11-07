/**
 * Modelos de animal — espelham o contrato do octopus-msusuario (AnimalRequest / AnimalResponse).
 *
 * O tutor não vai no corpo: vem da rota (POST /api/tutores/{id}/animais) e não muda na edição
 * (PUT /api/animais/{id}). A mãe é outro animal já cadastrado; o ms-internacao usa ela na RN-01 (ninhada só
 * com filhotes da mesma mãe). O `Animal` de `features/internacao` é uma versão enxuta, só com o que a
 * admissão usa.
 */

/** Espécies que a clínica atende (enum `Especie` do back, que manda e recebe o rótulo). */
export const ESPECIES = ['Cão', 'Gato', 'Outro'] as const;
export type Especie = (typeof ESPECIES)[number];

/** Sexo do animal (enum `SexoAnimal` do back). Só fêmea pode ser mãe. */
export type Sexo = 'MACHO' | 'FEMEA';
export const SEXOS: { valor: Sexo; rotulo: string }[] = [
  { valor: 'FEMEA', rotulo: 'Fêmea' },
  { valor: 'MACHO', rotulo: 'Macho' },
];

export function rotuloDoSexo(sexo: Sexo | null | undefined): string {
  return SEXOS.find((s) => s.valor === sexo)?.rotulo ?? 'sexo não informado';
}

/**
 * Resposta de GET/POST/PUT de animal. Espécie e sexo podem vir nulos em cadastros antigos: o animal sem espécie da
 * carga do enunciado e os animais cadastrados antes de 07/11/2026, que ficam sem sexo até a edição.
 */
export interface Animal {
  id: number;
  nome: string;
  tutorId: number;
  especie: Especie | null;
  sexo: Sexo | null;
  dataUltimaAntirrabica: string | null; // aaaa-MM-dd
  maeId: number | null;
}

/** Corpo do POST e do PUT. Atenção ao nome do campo da vacina, que difere do da resposta. */
export interface DadosAnimal {
  nome: string;
  especie: Especie;
  sexo: Sexo;
  dataAntirrabica: string | null; // aaaa-MM-dd
  maeId: number | null;
}

/**
 * Opção do campo "mãe": um animal já cadastrado, com o tutor no rótulo para diferenciar homônimos. Espécie e sexo
 * vão junto para o formulário mostrar só as fêmeas da mesma espécie, que é o que o back aceita.
 */
export interface OpcaoMae {
  id: number;
  rotulo: string;
  especie: Especie | null;
  sexo: Sexo | null;
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
