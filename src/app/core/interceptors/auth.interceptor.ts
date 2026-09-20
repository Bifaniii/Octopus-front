import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

/**
 * Anexa o token JWT no header `Authorization: Bearer <token>` de toda
 * requisição, quando há alguém logado. Assim as próximas chamadas a
 * endpoints protegidos (baias, animais, etc.) já vão autenticadas.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;

  if (!token) {
    return next(req);
  }

  const autenticada = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(autenticada);
};
