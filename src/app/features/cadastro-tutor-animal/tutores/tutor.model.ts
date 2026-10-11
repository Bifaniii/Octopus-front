/**
 * Modelos de tutor — espelham o contrato do octopus-msusuario (/api/tutores).
 *
 * Tutor é o cliente da clínica: não tem login nem senha (ver `usuario.model.ts`). Os campos abaixo são o que a
 * tela precisa; confira com o `TutorRequest`/`TutorResponse` do back antes de ligar na API.
 */

/** Resposta de GET/POST em /api/tutores. */
export interface Tutor {
  id: string; // UUID
  nome: string;
  cpf: string; // só dígitos
  telefone: string; // só dígitos
  email: string | null;
}

/** Corpo do POST /api/tutores. */
export type DadosTutor = Omit<Tutor, 'id'>;

export const SOMENTE_DIGITOS = /\D/g;

/** 12345678901 → 123.456.789-01 (devolve o texto como veio se não tiver 11 dígitos). */
export function formatarCpf(cpf: string): string {
  const d = cpf.replace(SOMENTE_DIGITOS, '');
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}

/** 11987654321 → (11) 98765-4321; 1133334444 → (11) 3333-4444. */
export function formatarTelefone(telefone: string): string {
  const d = telefone.replace(SOMENTE_DIGITOS, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}
