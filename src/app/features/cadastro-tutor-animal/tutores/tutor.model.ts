/**
 * Modelos de tutor — espelham o contrato do octopus-msusuario (TutorRequest / TutorResponse, /api/tutores).
 *
 * Tutor é o cliente da clínica: não tem login nem senha (ver `usuario.model.ts`). Cada tutor tem os seus
 * animais; todo animal tem exatamente um tutor (ver `animal.model.ts`).
 */
import { Animal, DadosAnimal } from '../animais/animal.model';

/** Resposta de GET/POST/PUT em /api/tutores, já com os animais do tutor. */
export interface Tutor {
  id: number;
  nome: string;
  endereco: string;
  dataNascimento: string; // aaaa-MM-dd
  telefone: string; // só dígitos
  animais: Animal[];
}

/** Corpo do PUT /api/tutores/{id}; o POST aceita também a lista `animais`, gravada junto, numa transação só. */
export interface DadosTutor {
  nome: string;
  endereco: string;
  dataNascimento: string;
  telefone: string;
  animais?: DadosAnimal[];
}

export const SOMENTE_DIGITOS = /\D/g;

/** 11987654321 → (11) 98765-4321; 1133334444 → (11) 3333-4444. */
export function formatarTelefone(telefone: string): string {
  const d = telefone.replace(SOMENTE_DIGITOS, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

/** aaaa-MM-dd → dd/MM/aaaa, sem passar por Date (que converteria fuso). */
export function formatarData(data: string | null): string {
  if (!data) return 'Sem registro';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}
