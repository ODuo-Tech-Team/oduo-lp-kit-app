// Converte o JSON do briefing num briefing-cliente.md preenchido,
// no mesmo formato que a persona.md do kit espera ler.

import { nomeAssetEquipamento } from './payload.js';

export function gerarBriefingMd(payload) {
  const c = payload.cliente || {};
  const co = payload.contato || {};
  const m = payload.marca || {};
  const t = payload.tipografia || {};
  const s = payload.sobre || {};
  const arquivosEquip = (payload.equipamentos && payload.equipamentos.arquivos) || [];
  const tom = payload.tom || {};

  const diferenciaisLista = (s.diferenciais || [])
    .filter(x => x && x.trim())
    .map(x => `- ${x}`)
    .join('\n');

  const equipamentosLista = arquivosEquip.length
    ? arquivosEquip
        .map((a, i) => `- \`${nomeAssetEquipamento(a, i)}\` (original: ${a.nome})`)
        .join('\n')
    : '';

  const referenciasLista = (tom.referencias || [])
    .filter(x => x && x.trim())
    .map(x => `- ${x}`)
    .join('\n') || '- (nenhuma fornecida)';

  const tomLabel = ({
    'formal': 'formal',
    'proximo-tecnico': 'próximo e técnico',
    'proximo-informal': 'próximo e informal'
  })[tom.tom] || tom.tom || 'próximo e técnico';

  return `# Briefing do Cliente

> Gerado automaticamente pelo app de briefing Oduo em ${new Date().toISOString()}.
> Versão do schema: ${payload.versao || 1}

---

## 1. Identificação do cliente

- **Nome da empresa:** ${c.nome || ''}
- **Slogan / frase de impacto:** ${c.slogan || '(não informado)'}
- **Segmento de atuação:** ${c.segmento || ''}
- **Cidade / região atendida:** ${c.regiao || ''}
- **Tem site atual?** ${c.urlSiteAtual || '(não informado)'}

## 2. Contato

- **WhatsApp** (com DDD, só números): ${(co.whatsapp || '').replace(/\D/g, '')}
- **Telefone fixo** (opcional): ${co.telefoneFixo || '(não informado)'}
- **E-mail:** ${co.email || ''}
- **Endereço completo:** ${co.endereco || ''}
- **Instagram / outras redes** (opcional): ${co.instagram || '(não informado)'}

## 3. Identidade visual

- **Cor primária da marca** (hex): ${m.corPrimaria || ''}
- **Cor secundária** (hex): ${m.corSecundaria || '#1a1a1a'}
${m.paleta ? `- **Paleta escolhida:** ${m.paleta.nome} (${m.paleta.descricao})` : '- **Paleta:** personalizada'}
- **Logo:** \`assets/logo.${logoExt(m.logo)}\` (já está em \`assets/\`)

### Tipografia escolhida no briefing

- **Combo:** ${t.nome || 'Padrão Oduo'}
- **Família de título:** ${t.titulo || 'Poppins'}
- **Família de corpo:** ${t.corpo || 'Inter'}
- **Google Fonts URL params:** \`${t.google || ''}\`

> Use essa tipografia no \`index.html\` em vez do Inter+Poppins padrão.

## 4. Sobre a empresa

- **Tempo de mercado:** ${s.anosMercado || ''} anos
- **Texto institucional curto**:
  \`\`\`
  ${s.textoInstitucional || ''}
  \`\`\`
- **Principais diferenciais**:
${diferenciaisLista}

## 5. Equipamentos / produtos

${arquivosEquip.length ? `O cliente anexou a lista de equipamentos nos arquivos abaixo (em \`assets/\`). **Extraia daqui os produtos/equipamentos** (nome, e descrição/specs quando houver) pra montar a seção de produtos da LP. Se um arquivo for planilha ou PDF, leia o conteúdo; se for imagem, leia o que está escrito.

${equipamentosLista}` : `> ⚠️ O cliente **ainda não enviou** a lista de equipamentos. Antes de montar a seção de produtos, peça a lista ao cliente OU monte uma seção genérica baseada no segmento (${c.segmento || 'ver identificação'}) e marque como provisória pra revisão.`}

## 6. Tom e estilo

- **Tom da comunicação:** ${tomLabel}
- **Referências visuais que gosta** (URLs):
${referenciasLista}
- **Algo a evitar?** ${tom.evitar || '(nada informado)'}

## 7. Observações livres

\`\`\`
${tom.observacoes || '(nenhuma)'}
\`\`\`

---

## Checklist para o Claude antes de começar

- [x] Nome da empresa
- [x] WhatsApp com DDD
- [x] Cor primária definida
- [x] Endereço completo
- [x] Logo anexado (em \`assets/\`)
- [${arquivosEquip.length ? 'x' : ' '}] Lista de equipamentos anexada (em \`assets/\`)${arquivosEquip.length ? '' : ' — **pendente: pedir ao cliente**'}
`;
}

function logoExt(logo) {
  if (!logo || !logo.tipo) return 'png';
  if (logo.tipo === 'image/svg+xml') return 'svg';
  if (logo.tipo === 'image/png') return 'png';
  if (logo.tipo === 'image/webp') return 'webp';
  return 'jpg';
}
