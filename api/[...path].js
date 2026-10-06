// Proxy das chamadas /api do front para os microsserviços.
//
// Existe para que nenhum endereço de backend fique no repositório: as URLs vêm das variáveis de
// ambiente, definidas no painel da Vercel em produção e no .env quando se roda localmente. Como o
// vercel.json não interpola variáveis, um rewrite estático obrigaria a versionar os IPs.
//
// De quebra, o navegador só enxerga o domínio do próprio front, então não há CORS para configurar
// nos serviços nem endereço de infraestrutura visível para quem abre o DevTools.

const ROTAS = [
  { prefixo: '/api/medicacoes', variavel: 'API_MEDICACOES_URL' },
  { prefixo: '/api/baias', variavel: 'API_BAIAS_URL' },
];
const VARIAVEL_PADRAO = 'API_DEFAULT_URL';

// Cabeçalhos que pertencem à conexão com a Vercel e não devem ser repassados adiante.
const NAO_REPASSAR = new Set([
  'host', 'connection', 'content-length', 'transfer-encoding',
  'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-vercel-id',
]);

function resolverBase(caminho) {
  const rota = ROTAS.find((r) => caminho === r.prefixo || caminho.startsWith(`${r.prefixo}/`));
  const variavel = rota ? rota.variavel : VARIAVEL_PADRAO;
  const base = process.env[variavel];
  return { variavel, base: base ? base.replace(/\/+$/, '') : null };
}

function corpoDaRequisicao(req) {
  if (req.body === undefined || req.body === null) {
    return null;
  }
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
    return req.body;
  }
  return JSON.stringify(req.body);
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'http://interno');
  const { variavel, base } = resolverBase(url.pathname);

  if (!base) {
    res.status(500).json({
      erro: 'Proxy sem destino configurado',
      mensagem: `Defina ${variavel} nas variáveis de ambiente do projeto.`,
    });
    return;
  }

  const cabecalhos = {};
  for (const [nome, valor] of Object.entries(req.headers)) {
    if (!NAO_REPASSAR.has(nome.toLowerCase())) {
      cabecalhos[nome] = valor;
    }
  }

  const corpo = ['GET', 'HEAD'].includes(req.method) ? undefined : corpoDaRequisicao(req);

  try {
    const resposta = await fetch(`${base}${url.pathname}${url.search}`, {
      method: req.method,
      headers: cabecalhos,
      body: corpo ?? undefined,
    });

    res.status(resposta.status);
    resposta.headers.forEach((valor, nome) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(nome)) {
        res.setHeader(nome, valor);
      }
    });
    res.send(Buffer.from(await resposta.arrayBuffer()));
  } catch (e) {
    res.status(502).json({
      erro: 'Backend indisponível',
      mensagem: `Não foi possível falar com o serviço em ${variavel}.`,
    });
  }
};

module.exports.resolverBase = resolverBase;
