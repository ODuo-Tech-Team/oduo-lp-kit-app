// Valida e sanitiza o payload do briefing antes de criar repo + commit.

export function validar(payload) {
  const erros = [];
  if (!payload || typeof payload !== 'object') return ['Payload ausente ou inválido'];

  const c = payload.cliente || {};
  if (!c.nome || c.nome.trim().length < 2) erros.push('cliente.nome ausente ou muito curto');
  if (!c.segmento) erros.push('cliente.segmento ausente');
  if (!c.regiao) erros.push('cliente.regiao ausente');

  const co = payload.contato || {};
  const ddd = (co.whatsapp || '').replace(/\D/g, '');
  if (ddd.length < 12 || ddd.length > 13) erros.push('contato.whatsapp inválido (12-13 dígitos com DDI+DDD)');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(co.email || '')) erros.push('contato.email inválido');
  if (!co.endereco) erros.push('contato.endereco ausente');

  const m = payload.marca || {};
  if (!m.logo || !m.logo.dataURL) erros.push('marca.logo ausente');
  if (!m.corPrimaria || !/^#[0-9a-fA-F]{6}$/.test(m.corPrimaria)) erros.push('marca.corPrimaria inválida');

  if (!payload.tipografia || !payload.tipografia.id) erros.push('tipografia ausente');

  const s = payload.sobre || {};
  if (!s.anosMercado || +s.anosMercado <= 0) erros.push('sobre.anosMercado inválido');
  if (!s.textoInstitucional) erros.push('sobre.textoInstitucional ausente');
  if (!Array.isArray(s.diferenciais) || s.diferenciais.length < 3) erros.push('sobre.diferenciais precisa de no mínimo 3');

  // Equipamentos é opcional: o cliente pode ainda não ter a lista pronta.
  // Não há validação obrigatória aqui.

  return erros;
}

export function slugificar(texto, max = 40) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
}

// Extensão de um arquivo de equipamentos: pelo nome primeiro, com fallback pelo mime.
export function extEquipamento(arq) {
  const nome = (arq && arq.nome ? arq.nome : '').toLowerCase();
  const m = /\.([a-z0-9]+)$/.exec(nome);
  if (m) return m[1];
  const tipo = (arq && arq.tipo) || '';
  if (tipo === 'application/pdf') return 'pdf';
  if (tipo === 'image/jpeg') return 'jpg';
  if (tipo === 'image/png') return 'png';
  if (tipo === 'image/webp') return 'webp';
  if (tipo === 'image/svg+xml') return 'svg';
  if (tipo === 'text/csv') return 'csv';
  if (tipo.includes('spreadsheetml')) return 'xlsx';
  if (tipo === 'application/vnd.ms-excel') return 'xls';
  if (tipo.includes('wordprocessingml')) return 'docx';
  if (tipo === 'application/msword') return 'doc';
  return 'bin';
}

// Caminho determinístico do arquivo de equipamentos dentro do repo do cliente.
// Mesma fórmula usada no briefing-md e no submit, pra os caminhos baterem.
export function nomeAssetEquipamento(arq, i) {
  return `assets/lista-equipamentos-${i + 1}.${extEquipamento(arq)}`;
}

// Converte dataURL "data:image/png;base64,iVBO..." em { base64, ext }
export function decodeDataURL(dataURL) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataURL || '');
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  const ext = mime === 'application/pdf' ? 'pdf'
    : mime === 'image/jpeg' ? 'jpg'
    : mime === 'image/png' ? 'png'
    : mime === 'image/webp' ? 'webp'
    : mime === 'image/svg+xml' ? 'svg'
    : 'bin';
  return { base64, ext, mime };
}
