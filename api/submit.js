// Vercel Serverless Function.
// Recebe o JSON do briefing, cria repo lp-{slug} na org, faz commit inicial,
// notifica Slack, retorna URL do repo.
//
// Env vars necessarias:
//   GITHUB_TOKEN       Personal Access Token com escopo `repo`
//   GITHUB_ORG         Org no GitHub (ex: ODuo-Tech-Team)
//   SLACK_WEBHOOK_URL  Webhook do Slack (opcional - se ausente, pula a notificacao)
//   ALLOWED_ORIGIN     CORS origin permitido (opcional - default *)

import { validar, slugificar, decodeDataURL } from '../lib/payload.js';
import { gerarBriefingMd } from '../lib/briefing-md.js';
import { gerarRodarMd } from '../lib/rodar-md.js';
import { criarRepo, repoExiste, commitBatch } from '../lib/github.js';
import { notificarBriefingNovo } from '../lib/slack.js';

const MAX_PAYLOAD_MB = 100;

export default async function handler(req, res) {
  // CORS
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, erro: 'Use POST' });

  // Env vars
  const token = process.env.GITHUB_TOKEN;
  const org = process.env.GITHUB_ORG || 'ODuo-Tech-Team';
  const slackUrl = process.env.SLACK_WEBHOOK_URL;

  if (!token) return res.status(500).json({ ok: false, erro: 'GITHUB_TOKEN nao configurado' });

  try {
    const payload = req.body;

    // Validacao
    const erros = validar(payload);
    if (erros.length) return res.status(400).json({ ok: false, erros });

    // Slug (com sufixo timestamp se ja existir um repo com o mesmo nome)
    let slug = slugificar(payload.cliente.nome) || 'lp-cliente';
    let repoNome = `lp-${slug}`;

    if (await repoExiste({ org, nome: repoNome, token })) {
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      repoNome = `lp-${slug}-${stamp}`;
      // se mesmo com data existir, adiciona random
      if (await repoExiste({ org, nome: repoNome, token })) {
        repoNome = `lp-${slug}-${stamp}-${Math.random().toString(36).slice(2, 6)}`;
      }
    }

    // Criar repo
    const repo = await criarRepo({
      org,
      nome: repoNome,
      descricao: `LP do cliente ${payload.cliente.nome} - ${payload.cliente.segmento}`,
      privado: true,
      token
    });

    // GitHub as vezes tem delay entre criar repo e a branch main estar disponivel.
    // Aguarda ~1.5s.
    await new Promise(r => setTimeout(r, 1500));

    // Monta arquivos pro commit
    const files = [];

    // Markdown e JSON sao utf-8
    files.push({
      path: 'briefing-cliente.md',
      content: gerarBriefingMd(payload),
      encoding: 'utf-8'
    });

    files.push({
      path: 'RODAR.md',
      content: gerarRodarMd(payload),
      encoding: 'utf-8'
    });

    // briefing.json - dump cru (sem dataURLs gigantes pra ficar legivel)
    const dumpLeve = JSON.parse(JSON.stringify(payload));
    if (dumpLeve.marca?.logo?.dataURL) dumpLeve.marca.logo.dataURL = '[base64 omitted]';
    (dumpLeve.produtos || []).forEach(p => {
      if (p.imagem?.dataURL) p.imagem.dataURL = '[base64 omitted]';
      if (p.catalogoPdf?.dataURL) p.catalogoPdf.dataURL = '[base64 omitted]';
    });
    files.push({
      path: 'briefing.json',
      content: JSON.stringify(dumpLeve, null, 2),
      encoding: 'utf-8'
    });

    // Logo
    if (payload.marca?.logo?.dataURL) {
      const dec = decodeDataURL(payload.marca.logo.dataURL);
      if (dec) {
        files.push({ path: `assets/logo.${dec.ext}`, content: dec.base64, encoding: 'base64' });
      }
    }

    // Produtos: imagem + catalogo PDF
    (payload.produtos || []).forEach((p, i) => {
      const baseSlug = p.slug || slugificar(p.nome) || `produto-${i + 1}`;

      if (p.imagem?.dataURL) {
        const dec = decodeDataURL(p.imagem.dataURL);
        if (dec) {
          files.push({ path: `assets/${baseSlug}.${dec.ext}`, content: dec.base64, encoding: 'base64' });
        }
      }

      if (p.catalogoPdf?.dataURL) {
        const dec = decodeDataURL(p.catalogoPdf.dataURL);
        if (dec) {
          files.push({ path: `assets/${baseSlug}-catalogo.pdf`, content: dec.base64, encoding: 'base64' });
        }
      }
    });

    // README simples do repo (substitui o auto-init)
    files.push({
      path: 'README.md',
      content: `# LP — ${payload.cliente.nome}

Repo gerado automaticamente pelo app de briefing Oduo.

- Segmento: ${payload.cliente.segmento}
- Slug: \`${slug}\`
- Gerado em: ${new Date().toISOString()}

**Como gerar a LP:** abra o [\`RODAR.md\`](./RODAR.md) e siga as instrucoes.

**Como aprovar:** depois que a LP for gerada e commitada, suba a pasta para o
Hostinger em \`public_html/clientes/${slug}/\`. URL final:
\`oduo.com.br/clientes/${slug}/\`.
`,
      encoding: 'utf-8'
    });

    // Commit batch
    await commitBatch({
      org,
      repo: repoNome,
      branch: 'main',
      files,
      mensagem: `feat: briefing inicial - ${payload.cliente.nome}`,
      token
    });

    // Slack (best-effort - nao quebra se falhar)
    const slackRes = await notificarBriefingNovo({
      webhookUrl: slackUrl,
      cliente: payload.cliente.nome,
      segmento: payload.cliente.segmento,
      repoUrl: repo.html_url,
      slug
    });

    return res.status(200).json({
      ok: true,
      repo: {
        nome: repoNome,
        url: repo.html_url,
        slug
      },
      slack: slackRes,
      arquivos: files.length
    });

  } catch (e) {
    console.error('[submit] erro:', e);
    return res.status(500).json({
      ok: false,
      erro: e.message,
      status: e.status,
      body: e.body
    });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: `${MAX_PAYLOAD_MB}mb` }
  }
};
