import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/usuario.model';

/**
 * Bloqueia a rota por PAPEL (role) do usuário. Combine com `authGuard`
 * e informe os papéis permitidos em `data.roles`:
 *
 *   {
 *     path: 'painel',
 *     canActivate: [authGuard, permissaoGuard],
 *     data: { roles: ['ROLE_ADMIN'] },
 *     ...
 *   }
 */
export const permissaoGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const roles = (route.data['roles'] as Role[] | undefined) ?? [];

  return auth.temRole(roles) ? true : router.createUrlTree(['/login']);
};
