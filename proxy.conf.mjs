import dotenv from 'dotenv';
dotenv.config();

// Proxy do `ng serve`. Usa as mesmas variáveis que a função api/[...path].js usa em produção, então o
// front se comporta igual nos dois lugares. Sem .env, cai nas portas locais de cada microsserviço.
const alvo = (variavel, padraoLocal) => ({
  target: process.env[variavel] || padraoLocal,
  secure: false,
  changeOrigin: true,
  logLevel: 'debug',
});

// EXPORTAÇÃO CORRIGIDA: Exportando diretamente o objeto de configuração
const PROXY_CONFIG = {
  '/api/medicacoes': alvo('API_MEDICACOES_URL', 'http://localhost:8082'),
  '/api/baias': alvo('API_BAIAS_URL', 'http://localhost:8081'),
  '/api/internacoes': alvo('API_INTERNACOES_URL', 'http://localhost:8083'),
  // O genérico fica por último: a primeira entrada que casa com o caminho é a que vale.
  '/api': alvo('API_DEFAULT_URL', 'http://localhost:8080'),
};

export default PROXY_CONFIG;

