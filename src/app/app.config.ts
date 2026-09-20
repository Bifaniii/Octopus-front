import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    // withFetch(): usa a Fetch API (melhor para SSR).
    // withInterceptors(): anexa o token JWT em cada requisição.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
  ],
};
