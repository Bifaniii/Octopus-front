/**
 * Modelos de autenticação — espelham o contrato do back-end
 * (microserviço octopus-msusuario, endpoint POST /api/auth/login).
 */

/** Papéis de acesso, exatamente como o back-end retorna. */
export type Role =
  | 'ROLE_ADMIN'
  | 'ROLE_VETERINARIO'
  | 'ROLE_AUXILIAR'
  | 'ROLE_RECEPCIONISTA'
  | 'ROLE_TUTOR';

/** Corpo enviado no POST /api/auth/login. */
export interface LoginRequest {
  email: string;
  senha: string;
}

/** Resposta do POST /api/auth/login. */
export interface LoginResponse {
  token: string;
  tipo: string;        // ex.: "Bearer"
  expiraEm: string;    // ISO-8601 (java.time.Instant)
  email: string;
  role: Role;
}

/** Usuário autenticado, guardado na sessão do front. */
export interface Usuario {
  email: string;
  role: Role;
}
