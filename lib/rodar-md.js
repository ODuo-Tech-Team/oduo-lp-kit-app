// Gera o RODAR.md que vai no repo do cliente.
// É o "1 prompt pra colar" que o dev usa no Claude Code pra gerar a LP sem pensar.

export function gerarRodarMd(payload) {
  const c = payload.cliente || {};
  const nomeCliente = c.nome || 'cliente';
  const segmento = c.segmento || '';

  return `# Como gerar a LP do cliente ${nomeCliente}

> Esse arquivo é o manual de 1 passo. Cola o prompt abaixo no Claude Code aberto
> nesta pasta. O Claude faz o resto (Etapas -1 a 5 da persona Oduo).

## Pré-requisitos

- Você está com o Claude Code instalado e logado com a assinatura Max
- Você tem a variável \`$env:ODUO_LP_KIT\` apontando pro clone local do
  \`oduo-lp-kit\`. Se não tem, configure uma vez:
  \`\`\`powershell
  [Environment]::SetEnvironmentVariable('ODUO_LP_KIT', 'c:\\caminho\\para\\oduo-lp-kit', 'User')
  \`\`\`
  (e abra um novo PowerShell)

## Passo a passo (1 minuto de trabalho ativo)

1. Abra esta pasta no terminal:
   \`\`\`powershell
   cd "<caminho-deste-repo>"
   claude
   \`\`\`

2. Cole o prompt abaixo como **primeira mensagem** no Claude Code.

3. Vai pegar um café — Claude faz tudo em ~20 min.

4. Quando terminar, confira o resultado abrindo \`index.html\` no navegador.
   Faça \`git add . && git commit -m "feat: LP ${nomeCliente}" && git push\`.

5. Suba a pasta inteira (\`index.html\`, \`styles.css\`, \`script.js\`, \`assets/\`)
   no Hostinger em \`public_html/clientes/${payload.cliente?.slug || 'slug'}/\`.

---

## O PROMPT (cola tudo abaixo no Claude Code)

\`\`\`
Você é o construtor oficial de LPs Oduo. Esta pasta é a do cliente "${nomeCliente}"
(segmento: ${segmento}). O briefing já está preenchido em ./briefing-cliente.md
e os assets já estão em ./assets/.

Etapa -1 — Sync com o kit (OBRIGATÓRIA primeiro):

1. Localize o repo oduo-lp-kit no disco. Tente nesta ordem:
   - Variável de ambiente $env:ODUO_LP_KIT
   - ..\\oduo-lp-kit\\ ou ..\\_template-LP-oduo\\
   - c:\\oduo\\oduo-lp-kit\\
   - c:\\Users\\mauri\\Desktop\\Projetos_Oduo\\LPs\\_template-LP-oduo\\
   Se não achar, pergunte ao usuário.
2. Rode: git -C "<caminho>" pull --rebase
3. Reporte: "✓ Kit sincronizado" ou liste os novos commits trazidos.

Depois leia, NESTA ORDEM, USANDO OS ARQUIVOS DO REPO (caminho absoluto):

1. persona.md — assume essa persona pra esta sessão inteira
2. historico-lps.md — vê quais variantes JÁ foram usadas (a próxima LP deve
   ser visualmente diferente das anteriores)
3. variacoes-design.md — catálogo de variantes (Hero A/B/C/D/E, etc)
4. design-craft.md — princípios de craft, matriz de ousadia, momentos WOW
   (OBRIGATÓRIO — separa LP "ok" de LP memorável)
5. ./briefing-cliente.md — dados deste cliente específico

Depois execute o fluxo completo da persona (Etapas 0 a 5):

- Etapa 0: calibração — combo de variantes diferente dos últimos clientes;
  comunique anchor visual, nível de ousadia, momentos WOW e microinteração
- Etapa 1: discovery — info do briefing já preenchido + site atual se houver URL
- Etapa 2: assets — eles já estão em ./assets/. Confira que cobrem hero +
  produtos. Se faltar hero, baixe do Wikimedia Commons baseado no segmento.
- Etapa 3: construção — copie templates do kit pra raiz desta pasta, substitua
  placeholders, adapte número de produtos. Use a tipografia escolhida no
  briefing (veja seção "Tipografia escolhida").
- Etapa 4: validação — checklist completo (ortografia, WhatsApp em 13 botões,
  mobile 375px, footer SEM "Desenvolvido por Oduo", craft 4/7)
- Etapa 5: entrega + registro no historico-lps.md DO REPO (sem dados sensíveis)
  + commit + push pro origin/main do oduo-lp-kit (peça confirmação)

Você tem permissão para criar pastas, baixar imagens, escrever HTML/CSS/JS,
executar git e abrir o resultado no navegador. Use PowerShell pra comandos
de sistema.

Pergunte antes de chutar se faltar info crítica.

Comece pelo sync agora.
\`\`\`

---

## O que esse repo contém

- \`briefing-cliente.md\` — briefing já preenchido pelo cliente (lido pelo Claude)
- \`briefing.json\` — dump cru do app de briefing (referência/debug)
- \`assets/\` — logo, fotos de produto, PDFs de catálogo (anexados pelo cliente)
- \`RODAR.md\` — este arquivo
- (depois da execução do prompt acima) \`index.html\`, \`styles.css\`, \`script.js\`
  na raiz: a LP pronta pra subir no Hostinger
`;
}
