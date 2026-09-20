import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Bloqueia a rota se o usuário NÃO estiver logado, redirecionando
 * para /login. Uso na rota:
 *
 *   { path: 'baias', canActivate: [authGuard], ... }
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.estaLogado() ? true : router.createUrlTree(['/login']);
};
