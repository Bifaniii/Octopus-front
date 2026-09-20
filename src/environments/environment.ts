/**
 * Configuração de ambiente.
 *
 * `apiBaseUrl` é o prefixo de todas as chamadas à API. Fica relativo
 * (`/api`) de propósito:
 *   - Em desenvolvimento, o `proxy.conf.json` redireciona `/api` para
 *     o back-end (http://localhost:8080), evitando problemas de CORS.
 *   - Em produção, o front é servido atrás do mesmo domínio/gateway
 *     que expõe `/api`.
 *
 * Se um dia precisar apontar para outro host, troque para a URL
 * absoluta (ex.: 'https://api.suaclinica.com/api').
 */
export const environment = {
  producao: false,
  apiBaseUrl: '/api',
};
