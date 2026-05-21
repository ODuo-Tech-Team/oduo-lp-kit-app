// Converte o JSON do briefing num briefing-cliente.md preenchido,
// no mesmo formato que a persona.md do kit espera ler.

export function gerarBriefingMd(payload) {
  const c = payload.cliente || {};
  const co = payload.contato || {};
  const m = payload.marca || {};
  const t = payload.tipografia || {};
  const s = payload.sobre || {};
  const produtos = payload.produtos || [];
  const tom = payload.tom || {};

  const diferenciaisLista = (s.diferenciais || [])
    .filter(x => x && x.trim())
    .map(x => `- ${x}`)
    .join('\n');

  const produtosLista = produtos.map((p, i) => {
    const slug = p.slug || `produto-${i + 1}`;
    const img = `assets/${slug}.${(p.imagem && p.imagem.tipo === 'image/png') ? 'png'
      : (p.imagem && p.imagem.tipo === 'image/webp') ? 'webp' : 'jpg'}`;
    const pdfBlock = p.catalogoPdf
      ? `  - Catálogo PDF: \`assets/${slug}-catalogo.pdf\``
      : '';
    return [
      `- **Produto ${i + 1}:**`,
      `  - Nome: ${p.nome}`,
      `  - Descrição: ${p.descricao}`,
      `  - Imagem: \`${img}\``,
      pdfBlock
    ].filter(Boolean).join('\n');
  }).join('\n\n');

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
- **Cliente tem fotos próprias dos serviços?** sim — anexadas em \`assets/\`

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

## 5. Produtos / serviços

${produtosLista}

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
- [x] Pelo menos 3 produtos/serviços
- [x] Cor primária definida
- [x] Endereço completo
- [x] Logo anexado (em \`assets/\`)
- [x] Fotos de produto anexadas (em \`assets/\`)
${produtos.some(p => p.catalogoPdf) ? `- [x] Catálogos PDF de produtos anexados (em \`assets/\`)` : ''}
`;
}

function logoExt(logo) {
  if (!logo || !logo.tipo) return 'png';
  if (logo.tipo === 'image/svg+xml') return 'svg';
  if (logo.tipo === 'image/png') return 'png';
  if (logo.tipo === 'image/webp') return 'webp';
  return 'jpg';
}
