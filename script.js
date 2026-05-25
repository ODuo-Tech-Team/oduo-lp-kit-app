/* =========================================================
   Oduo LP Kit — App de Briefing
   Vanilla JS. Sem build. Sem dependências.
   ========================================================= */

const TOTAL_ETAPAS = 8;
const STORAGE_KEY = 'oduo-briefing-v1';

const ESTADO_INICIAL = () => ({
  view: 'welcome',
  etapa: 0,
  dados: {
    identificacao: {
      nome: '', slogan: '', segmento: '', regiao: '', urlSiteAtual: ''
    },
    contato: {
      whatsapp: '', telefoneFixo: '', email: '', endereco: '', instagram: ''
    },
    marca: {
      logo: null,         // { nome, tamanho, dataURL }
      paletaId: '',
      corPrimaria: '',
      corSecundaria: ''
    },
    tipografia: {
      fonteId: ''
    },
    sobre: {
      anosMercado: '',
      textoInstitucional: '',
      diferenciais: ['', '', '']
    },
    equipamentos: {
      arquivos: []        // [{ nome, tamanho, tipo, dataURL }] — PDF, planilha, Word ou imagem
    },
    tom: {
      tom: 'proximo-tecnico',
      referencias: ['', ''],
      evitar: '',
      observacoes: ''
    }
  }
});

let STATE = ESTADO_INICIAL();

/* =========================================================
   Storage
   ========================================================= */

function salvar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
  } catch (e) {
    // QuotaExceeded (arquivos muito grandes) — salva sem dataURLs
    const copia = JSON.parse(JSON.stringify(STATE));
    if (copia.dados.marca.logo) copia.dados.marca.logo.dataURL = '';
    (copia.dados.equipamentos?.arquivos || []).forEach(a => { a.dataURL = ''; });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(copia)); } catch {}
  }
}

function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const carregado = JSON.parse(raw);
    if (carregado && carregado.view && carregado.dados) {
      STATE = carregado;
      // Compat com briefings salvos antes da etapa de equipamentos por arquivo
      if (!STATE.dados.equipamentos || !Array.isArray(STATE.dados.equipamentos.arquivos)) {
        STATE.dados.equipamentos = { arquivos: [] };
      }
      delete STATE.dados.produtos;
    }
  } catch {}
}

function resetar() {
  localStorage.removeItem(STORAGE_KEY);
  STATE = ESTADO_INICIAL();
}

/* =========================================================
   Helpers
   ========================================================= */

const qs = (sel, parent = document) => parent.querySelector(sel);
const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));
const el = (html) => {
  const wrap = document.createElement('div');
  wrap.innerHTML = html.trim();
  return wrap.firstElementChild;
};

// Limites por tipo de arquivo. O total precisa caber em ~3.5MB de binario
// (== ~4.5MB base64, que é o limite de payload do Vercel Functions).
const LIMITES_MB = { logo: 0.5, lista: 3 };
const MAX_PAYLOAD_BIN_MB = 3.5;

// Tipos aceitos na lista de equipamentos: PDF, planilha, Word e imagem.
const ACCEPT_EQUIPAMENTOS =
  '.pdf,.xls,.xlsx,.csv,.doc,.docx,' +
  'image/*,application/pdf,' +
  'application/vnd.ms-excel,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'text/csv,application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function lerArquivo(file, limiteMB = 1) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const limiteBytes = limiteMB * 1024 * 1024;
    if (file.size > limiteBytes) {
      const tamanhoMB = (file.size / 1024 / 1024).toFixed(2);
      return reject(new Error(
        `Arquivo "${file.name}" tem ${tamanhoMB} MB — passa do limite de ${limiteMB} MB. ` +
        `Comprima a imagem (ex: tinypng.com) ou escolha outra.`
      ));
    }
    const reader = new FileReader();
    reader.onload = () => resolve({
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
      dataURL: reader.result
    });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function tamanhoTotalBinarioMB() {
  let total = 0;
  if (STATE.dados.marca.logo) total += STATE.dados.marca.logo.tamanho || 0;
  (STATE.dados.equipamentos.arquivos || []).forEach(a => { total += a.tamanho || 0; });
  return total / 1024 / 1024;
}

function formatarTamanho(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function slug(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ehEmailValido(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function ehWhatsappValido(s) {
  const digitos = (s || '').replace(/\D/g, '');
  return digitos.length >= 12 && digitos.length <= 13;
}

/* =========================================================
   Render — dispatch
   ========================================================= */

function render() {
  const screen = qs('#screen');
  const topbarMeta = qs('#topbarMeta');
  const navbar = qs('#navbar');
  screen.innerHTML = '';

  if (STATE.view === 'welcome') {
    topbarMeta.hidden = true;
    navbar.hidden = true;
    screen.appendChild(qs('#tplWelcome').content.cloneNode(true));
    qs('#btnComecar').addEventListener('click', () => irPara(1));
    return;
  }

  if (STATE.view === 'enviando') {
    topbarMeta.hidden = true;
    navbar.hidden = true;
    screen.appendChild(qs('#tplEnviando').content.cloneNode(true));
    return;
  }

  if (STATE.view === 'sucesso') {
    topbarMeta.hidden = true;
    navbar.hidden = true;
    screen.appendChild(qs('#tplSucesso').content.cloneNode(true));
    // Recomeça do zero pro proximo cliente (o localStorage ja foi limpo no envio)
    qs('#btnNovoBriefing').addEventListener('click', () => {
      resetar();
      window.scrollTo({ top: 0 });
      render();
    });
    return;
  }

  if (STATE.view === 'erro') {
    topbarMeta.hidden = true;
    navbar.hidden = true;
    screen.appendChild(qs('#tplErro').content.cloneNode(true));
    const msg = STATE.dados._erro || 'Houve um erro ao mandar pro servidor.';
    qs('#erroMsg').textContent = msg;
    qs('#btnTentarDeNovo').addEventListener('click', () => { enviar(); });
    qs('#btnVoltarRevisar').addEventListener('click', () => { irPara(TOTAL_ETAPAS); });
    return;
  }

  // Etapas 1-8
  topbarMeta.hidden = false;
  navbar.hidden = false;
  qs('#etapaAtual').textContent = STATE.etapa;
  qs('#progressBar').style.width = (STATE.etapa / TOTAL_ETAPAS * 100) + '%';

  const etapaWrap = el(`<div class="etapa"></div>`);
  ETAPAS[STATE.etapa].render(etapaWrap);
  screen.appendChild(etapaWrap);

  // Botões
  qs('#btnVoltar').disabled = STATE.etapa === 1;
  qs('#btnProximo').innerHTML = STATE.etapa === TOTAL_ETAPAS
    ? 'Enviar briefing <i class="fa-solid fa-paper-plane"></i>'
    : 'Próximo <i class="fa-solid fa-arrow-right"></i>';
}

function irPara(etapa) {
  if (etapa === 0) { STATE.view = 'welcome'; STATE.etapa = 0; }
  else if (etapa >= 1 && etapa <= TOTAL_ETAPAS) { STATE.view = 'etapa'; STATE.etapa = etapa; }
  salvar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

/* =========================================================
   Definição das etapas
   ========================================================= */

const ETAPAS = {

  /* ETAPA 1 — Identificação */
  1: {
    render(wrap) {
      const d = STATE.dados.identificacao;
      wrap.innerHTML = `
        <div class="etapa__head">
          <span class="etapa__eyebrow">Etapa 1 — Identificação</span>
          <h1 class="etapa__title">Quem é a sua empresa?</h1>
          <p class="etapa__desc">Essas informações vão no topo, no rodapé e nos metadados da LP.</p>
        </div>
        <div class="etapa__body">
          <div class="field">
            <label class="field__label">Nome da empresa <span class="req">*</span></label>
            <input class="input" name="nome" value="${esc(d.nome)}" placeholder="Ex: Locar Equipamentos">
          </div>
          <div class="field">
            <label class="field__label">Slogan ou frase de impacto <span class="opt">(opcional)</span></label>
            <input class="input" name="slogan" value="${esc(d.slogan)}" placeholder="Ex: Sua obra mais segura">
          </div>
          <div class="field">
            <label class="field__label">Segmento de atuação <span class="req">*</span></label>
            <input class="input" name="segmento" value="${esc(d.segmento)}" placeholder="Ex: locação de equipamentos para construção">
          </div>
          <div class="field">
            <label class="field__label">Cidade / região atendida <span class="req">*</span></label>
            <input class="input" name="regiao" value="${esc(d.regiao)}" placeholder="Ex: Grande Florianópolis e Lages/SC">
          </div>
          <div class="field">
            <label class="field__label">Tem site atual? <span class="opt">(opcional)</span></label>
            <input class="input" name="urlSiteAtual" value="${esc(d.urlSiteAtual)}" placeholder="https://...">
            <span class="field__hint">Se tiver, vamos extrair informações úteis dele.</span>
          </div>
        </div>
      `;
      bindInputs(wrap, STATE.dados.identificacao);
    },
    validar() {
      const d = STATE.dados.identificacao;
      const erros = {};
      if (!d.nome.trim()) erros.nome = 'Obrigatório';
      if (!d.segmento.trim()) erros.segmento = 'Obrigatório';
      if (!d.regiao.trim()) erros.regiao = 'Obrigatório';
      return erros;
    }
  },

  /* ETAPA 2 — Contato */
  2: {
    render(wrap) {
      const d = STATE.dados.contato;
      wrap.innerHTML = `
        <div class="etapa__head">
          <span class="etapa__eyebrow">Etapa 2 — Contato</span>
          <h1 class="etapa__title">Como o cliente fala com você?</h1>
          <p class="etapa__desc">O WhatsApp vai aparecer em todos os botões da LP.</p>
        </div>
        <div class="etapa__body">
          <div class="field">
            <label class="field__label">WhatsApp (com DDD) <span class="req">*</span></label>
            <input class="input" name="whatsapp" value="${esc(d.whatsapp)}" placeholder="Ex: 5549991867121">
            <span class="field__hint">Só números, com código do país (55) + DDD + número.</span>
          </div>
          <div class="field-row">
            <div class="field">
              <label class="field__label">Telefone fixo <span class="opt">(opcional)</span></label>
              <input class="input" name="telefoneFixo" value="${esc(d.telefoneFixo)}" placeholder="(49) 3222-0000">
            </div>
            <div class="field">
              <label class="field__label">E-mail <span class="req">*</span></label>
              <input class="input" name="email" value="${esc(d.email)}" placeholder="contato@empresa.com.br">
            </div>
          </div>
          <div class="field">
            <label class="field__label">Endereço completo <span class="req">*</span></label>
            <input class="input" name="endereco" value="${esc(d.endereco)}" placeholder="Rua, número — Bairro, Cidade/UF">
          </div>
          <div class="field">
            <label class="field__label">Instagram / outras redes <span class="opt">(opcional)</span></label>
            <input class="input" name="instagram" value="${esc(d.instagram)}" placeholder="@suaempresa">
          </div>
        </div>
      `;
      bindInputs(wrap, STATE.dados.contato);
    },
    validar() {
      const d = STATE.dados.contato;
      const erros = {};
      if (!ehWhatsappValido(d.whatsapp)) erros.whatsapp = 'WhatsApp inválido (12-13 dígitos com DDI+DDD)';
      if (!ehEmailValido(d.email)) erros.email = 'E-mail inválido';
      if (!d.endereco.trim()) erros.endereco = 'Obrigatório';
      return erros;
    }
  },

  /* ETAPA 3 — Logo + Paleta */
  3: {
    render(wrap) {
      const d = STATE.dados.marca;
      const paletasHTML = window.PALETAS.map(p => `
        <button type="button" class="paleta-card ${d.paletaId === p.id ? 'is-selected' : ''}" data-paleta-id="${p.id}">
          <div class="paleta-card__swatches">
            <div class="paleta-card__swatch" style="background:${p.primary}"></div>
            <div class="paleta-card__swatch" style="background:${p.secondary}"></div>
          </div>
          <div class="paleta-card__nome">${p.nome}</div>
          <div class="paleta-card__desc">${p.descricao}</div>
        </button>
      `).join('');

      wrap.innerHTML = `
        <div class="etapa__head">
          <span class="etapa__eyebrow">Etapa 3 — Marca</span>
          <h1 class="etapa__title">Logo e paleta de cor</h1>
          <p class="etapa__desc">A paleta define a cor dos botões, ícones e destaques da LP.</p>
        </div>
        <div class="etapa__body">

          <div class="field">
            <label class="field__label">Logo da empresa <span class="req">*</span></label>
            <label class="upload ${d.logo ? 'is-filled' : ''}" id="uploadLogo">
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" name="logo">
              ${d.logo ? renderUploadPreview(d.logo, 'logo') : `
                <i class="fa-solid fa-cloud-arrow-up upload__icon"></i>
                <div class="upload__label">Clique pra escolher o arquivo</div>
                <div class="upload__hint">PNG, JPG, SVG ou WebP — até 500 KB</div>
              `}
            </label>
          </div>

          <div class="field">
            <label class="field__label">Paleta de cor <span class="req">*</span></label>
            <span class="field__hint" style="margin-bottom:14px;">Escolha uma das paletas curadas ou use uma cor personalizada.</span>
            <div class="paleta-grid">${paletasHTML}</div>
            <div class="paleta-custom">
              <div class="field__label" style="margin-bottom:10px;">Ou use uma cor personalizada</div>
              <div class="paleta-custom__row">
                <input type="color" name="corPrimaria" value="${d.corPrimaria || '#ca651d'}">
                <input class="input" name="corPrimariaHex" value="${esc(d.corPrimaria)}" placeholder="#ca651d" maxlength="7">
              </div>
            </div>
          </div>

        </div>
      `;
      bindMarca(wrap);
    },
    validar() {
      const d = STATE.dados.marca;
      const erros = {};
      if (!d.logo) erros.logo = 'Anexe o logo';
      if (!d.paletaId && !d.corPrimaria) erros.paleta = 'Escolha uma paleta ou cor personalizada';
      return erros;
    }
  },

  /* ETAPA 4 — Tipografia */
  4: {
    render(wrap) {
      const d = STATE.dados.tipografia;
      const fontesHTML = window.FONTES.map(f => `
        <button type="button" class="fonte-card ${d.fonteId === f.id ? 'is-selected' : ''}" data-fonte-id="${f.id}">
          <div class="fonte-card__nome">${f.nome}</div>
          <div class="fonte-card__desc">${f.descricao}</div>
          <div class="fonte-card__preview">
            <div class="fonte-card__preview-titulo" style="font-family:'${f.titulo}', sans-serif;">
              Equipamentos para sua obra
            </div>
            <div class="fonte-card__preview-corpo" style="font-family:'${f.corpo}', sans-serif;">
              Soluções completas em locação para construção civil, com entrega rápida e suporte técnico.
            </div>
          </div>
        </button>
      `).join('');

      wrap.innerHTML = `
        <div class="etapa__head">
          <span class="etapa__eyebrow">Etapa 4 — Tipografia</span>
          <h1 class="etapa__title">Qual estilo de fonte combina com a empresa?</h1>
          <p class="etapa__desc">Veja como o título e o corpo de texto vão ficar na sua LP.</p>
        </div>
        <div class="etapa__body">
          <div class="fonte-grid">${fontesHTML}</div>
        </div>
      `;
      qsa('.fonte-card', wrap).forEach(card => {
        card.addEventListener('click', () => {
          STATE.dados.tipografia.fonteId = card.dataset.fonteId;
          salvar();
          qsa('.fonte-card', wrap).forEach(c => c.classList.remove('is-selected'));
          card.classList.add('is-selected');
        });
      });
    },
    validar() {
      const d = STATE.dados.tipografia;
      return d.fonteId ? {} : { fonteId: 'Escolha uma das opções' };
    }
  },

  /* ETAPA 5 — Sobre a empresa */
  5: {
    render(wrap) {
      const d = STATE.dados.sobre;
      const diferenciaisHTML = d.diferenciais.map((dif, i) => `
        <div class="dyn-item" data-idx="${i}">
          <input class="input" data-diferencial="${i}" value="${esc(dif)}" placeholder="Ex: Entrega em até 24h">
          <button type="button" class="dyn-item__remove" data-remover="${i}" ${d.diferenciais.length <= 3 ? 'disabled' : ''} title="Remover">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `).join('');

      wrap.innerHTML = `
        <div class="etapa__head">
          <span class="etapa__eyebrow">Etapa 5 — Sobre a empresa</span>
          <h1 class="etapa__title">Conte um pouco da sua história.</h1>
          <p class="etapa__desc">Isso vai virar a seção "Sobre" e os diferenciais da LP.</p>
        </div>
        <div class="etapa__body">
          <div class="field-row">
            <div class="field">
              <label class="field__label">Tempo de mercado (anos) <span class="req">*</span></label>
              <input class="input" type="number" name="anosMercado" value="${esc(d.anosMercado)}" placeholder="Ex: 15" min="0" max="200">
            </div>
            <div></div>
          </div>
          <div class="field">
            <label class="field__label">Texto institucional (2-3 frases) <span class="req">*</span></label>
            <textarea class="textarea" name="textoInstitucional" placeholder="O que sua empresa faz, pra quem, e qual o diferencial.">${esc(d.textoInstitucional)}</textarea>
          </div>
          <div class="field">
            <label class="field__label">Principais diferenciais <span class="req">*</span></label>
            <span class="field__hint" style="margin-bottom:14px;">Mínimo 3, máximo 6. Frases curtas.</span>
            <div class="dyn-list" id="dyn-diferenciais">${diferenciaisHTML}</div>
            <button type="button" class="dyn-add" id="addDiferencial" ${d.diferenciais.length >= 6 ? 'disabled' : ''}>
              <i class="fa-solid fa-plus"></i> Adicionar diferencial
            </button>
          </div>
        </div>
      `;
      bindSobre(wrap);
    },
    validar() {
      const d = STATE.dados.sobre;
      const erros = {};
      if (!d.anosMercado || +d.anosMercado <= 0) erros.anosMercado = 'Obrigatório';
      if (!d.textoInstitucional.trim()) erros.textoInstitucional = 'Obrigatório';
      const preenchidos = d.diferenciais.filter(x => x.trim()).length;
      if (preenchidos < 3) erros.diferenciais = 'Preencha pelo menos 3 diferenciais';
      return erros;
    }
  },

  /* ETAPA 6 — Equipamentos (lista por arquivo, opcional) */
  6: {
    render(wrap) {
      const arquivos = STATE.dados.equipamentos.arquivos;
      const arquivosHTML = arquivos.map((a, i) => `
        <div class="equip-item">
          ${renderUploadPreview(a, 'equipamento', i)}
        </div>
      `).join('');

      wrap.innerHTML = `
        <div class="etapa__head">
          <span class="etapa__eyebrow">Etapa 6 — Equipamentos</span>
          <h1 class="etapa__title">Tem a lista de equipamentos?</h1>
          <p class="etapa__desc">Anexe um PDF, planilha, documento ou foto com os equipamentos/produtos. É opcional — se o cliente ainda não tiver a lista, pode pular esta etapa.</p>
        </div>
        <div class="etapa__body">
          <div class="field">
            <label class="field__label">Lista de equipamentos <span class="opt">(opcional)</span></label>
            <label class="upload" id="uploadEquipamentos">
              <input type="file" accept="${ACCEPT_EQUIPAMENTOS}" data-equipamentos multiple>
              <i class="fa-solid fa-cloud-arrow-up upload__icon"></i>
              <div class="upload__label">Clique pra escolher arquivos</div>
              <div class="upload__hint">PDF, planilha (XLSX/CSV), Word ou imagem — até ${LIMITES_MB.lista} MB cada</div>
            </label>
            ${arquivos.length ? `<div class="equip-lista">${arquivosHTML}</div>` : ''}
          </div>
        </div>
      `;
      bindEquipamentos(wrap);
    },
    validar() { return {}; } // opcional — sempre pode avançar
  },

  /* ETAPA 7 — Tom e referências */
  7: {
    render(wrap) {
      const d = STATE.dados.tom;
      wrap.innerHTML = `
        <div class="etapa__head">
          <span class="etapa__eyebrow">Etapa 7 — Tom e referências</span>
          <h1 class="etapa__title">Como sua marca conversa?</h1>
          <p class="etapa__desc">Tudo opcional, mas ajuda a calibrar o tom dos textos.</p>
        </div>
        <div class="etapa__body">
          <div class="field">
            <label class="field__label">Tom da comunicação</label>
            <select class="select" name="tom">
              <option value="formal" ${d.tom === 'formal' ? 'selected' : ''}>Formal</option>
              <option value="proximo-tecnico" ${d.tom === 'proximo-tecnico' ? 'selected' : ''}>Próximo e técnico (padrão Oduo)</option>
              <option value="proximo-informal" ${d.tom === 'proximo-informal' ? 'selected' : ''}>Próximo e informal</option>
            </select>
          </div>
          <div class="field-row">
            <div class="field">
              <label class="field__label">Referência visual 1 <span class="opt">(URL)</span></label>
              <input class="input" data-ref="0" value="${esc(d.referencias[0] || '')}" placeholder="https://...">
            </div>
            <div class="field">
              <label class="field__label">Referência visual 2 <span class="opt">(URL)</span></label>
              <input class="input" data-ref="1" value="${esc(d.referencias[1] || '')}" placeholder="https://...">
            </div>
          </div>
          <div class="field">
            <label class="field__label">Algo a evitar? <span class="opt">(opcional)</span></label>
            <input class="input" name="evitar" value="${esc(d.evitar)}" placeholder="Ex: não usar verde, não mencionar concorrentes">
          </div>
          <div class="field">
            <label class="field__label">Observações livres <span class="opt">(opcional)</span></label>
            <textarea class="textarea" name="observacoes" placeholder="Qualquer coisa que ajude o time Oduo a entender sua marca.">${esc(d.observacoes)}</textarea>
          </div>
        </div>
      `;
      bindTom(wrap);
    },
    validar() { return {}; }
  },

  /* ETAPA 8 — Confirmação */
  8: {
    render(wrap) {
      const d = STATE.dados;
      const fonte = (window.FONTES || []).find(f => f.id === d.tipografia.fonteId);
      const paleta = (window.PALETAS || []).find(p => p.id === d.marca.paletaId);
      const cor = d.marca.corPrimaria || (paleta ? paleta.primary : '—');

      const diferenciais = d.sobre.diferenciais.filter(x => x.trim());
      const equipArquivos = d.equipamentos.arquivos || [];

      wrap.innerHTML = `
        <div class="etapa__head">
          <span class="etapa__eyebrow">Etapa 8 — Confirmação</span>
          <h1 class="etapa__title">Confere se está tudo certo.</h1>
          <p class="etapa__desc">Ao clicar em "Enviar briefing", o time Oduo recebe tudo isso.</p>
        </div>
        <div class="etapa__body">
          <div class="confirm-list">
            ${item('Empresa', d.identificacao.nome)}
            ${item('Segmento', d.identificacao.segmento)}
            ${item('Região', d.identificacao.regiao)}
            ${item('WhatsApp', d.contato.whatsapp)}
            ${item('E-mail', d.contato.email)}
            ${item('Endereço', d.contato.endereco)}
            ${item('Logo', d.marca.logo ? d.marca.logo.nome : '—')}
            ${item('Paleta', paleta ? paleta.nome : (cor || '—'), `<span class="paleta-card__swatch" style="display:inline-block;width:16px;height:16px;background:${cor};border-radius:4px;vertical-align:middle;margin-right:6px;"></span>`)}
            ${item('Tipografia', fonte ? fonte.nome : '—')}
            ${item('Anos de mercado', d.sobre.anosMercado + (d.sobre.anosMercado ? ' anos' : ''))}
            ${item('Diferenciais', diferenciais.length ? `<ul>${diferenciais.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '—', null, true)}
            ${item('Equipamentos', equipArquivos.length ? `${equipArquivos.length} arquivo(s)<ul>${equipArquivos.map(a => `<li>${esc(a.nome)} <span style="color:var(--text-muted);font-size:12px;">(${formatarTamanho(a.tamanho)})</span></li>`).join('')}</ul>` : 'Não enviado (cliente ainda não tem a lista)', null, true)}
            ${item('Tom', tomLabel(d.tom.tom))}
          </div>
        </div>
      `;

      function item(label, valor, prefix = '', html = false) {
        return `
          <div class="confirm-item">
            <div class="confirm-item__label">${label}</div>
            <div class="confirm-item__value">${prefix || ''}${html ? (valor || '—') : esc(valor || '—')}</div>
          </div>
        `;
      }
    },
    validar() { return {}; }
  }

};

/* =========================================================
   Bindings
   ========================================================= */

function bindInputs(wrap, target) {
  qsa('input[name], textarea[name], select[name]', wrap).forEach(input => {
    input.addEventListener('input', () => {
      target[input.name] = input.value;
      salvar();
    });
  });
}

function bindMarca(wrap) {
  // Upload de logo
  qs('input[name="logo"]', wrap).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      STATE.dados.marca.logo = await lerArquivo(file, LIMITES_MB.logo);
      salvar();
      ETAPAS[3].render(wrap);
    } catch (err) {
      alert(err.message);
    }
  });

  // Remover logo
  const removerBtn = qs('[data-remover-upload="logo"]', wrap);
  if (removerBtn) {
    removerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      STATE.dados.marca.logo = null;
      salvar();
      ETAPAS[3].render(wrap);
    });
  }

  // Paletas curadas
  qsa('.paleta-card', wrap).forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.paletaId;
      const p = window.PALETAS.find(x => x.id === id);
      STATE.dados.marca.paletaId = id;
      STATE.dados.marca.corPrimaria = p.primary;
      STATE.dados.marca.corSecundaria = p.secondary;
      salvar();
      qsa('.paleta-card', wrap).forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      // sincroniza inputs custom
      const colorInput = qs('input[name="corPrimaria"]', wrap);
      const hexInput = qs('input[name="corPrimariaHex"]', wrap);
      if (colorInput) colorInput.value = p.primary;
      if (hexInput) hexInput.value = p.primary;
    });
  });

  // Cor custom (color picker e hex sincronizam)
  const colorInput = qs('input[name="corPrimaria"]', wrap);
  const hexInput = qs('input[name="corPrimariaHex"]', wrap);
  colorInput.addEventListener('input', () => {
    STATE.dados.marca.corPrimaria = colorInput.value;
    STATE.dados.marca.paletaId = '';
    hexInput.value = colorInput.value;
    salvar();
    qsa('.paleta-card', wrap).forEach(c => c.classList.remove('is-selected'));
  });
  hexInput.addEventListener('input', () => {
    let v = hexInput.value.trim();
    if (v && !v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      colorInput.value = v;
      STATE.dados.marca.corPrimaria = v;
      STATE.dados.marca.paletaId = '';
      salvar();
      qsa('.paleta-card', wrap).forEach(c => c.classList.remove('is-selected'));
    }
  });
}

function bindSobre(wrap) {
  qs('input[name="anosMercado"]', wrap).addEventListener('input', e => {
    STATE.dados.sobre.anosMercado = e.target.value;
    salvar();
  });
  qs('textarea[name="textoInstitucional"]', wrap).addEventListener('input', e => {
    STATE.dados.sobre.textoInstitucional = e.target.value;
    salvar();
  });
  qsa('input[data-diferencial]', wrap).forEach(input => {
    input.addEventListener('input', e => {
      const idx = +input.dataset.diferencial;
      STATE.dados.sobre.diferenciais[idx] = e.target.value;
      salvar();
    });
  });
  qsa('[data-remover]', wrap).forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.remover;
      STATE.dados.sobre.diferenciais.splice(idx, 1);
      salvar();
      ETAPAS[5].render(wrap);
    });
  });
  qs('#addDiferencial', wrap).addEventListener('click', () => {
    if (STATE.dados.sobre.diferenciais.length >= 6) return;
    STATE.dados.sobre.diferenciais.push('');
    salvar();
    ETAPAS[5].render(wrap);
  });
}

function bindEquipamentos(wrap) {
  // Upload (multiplo): le cada arquivo e adiciona na lista. Falhas (ex: tamanho)
  // sao acumuladas e mostradas juntas, sem abortar os arquivos validos.
  qs('input[data-equipamentos]', wrap).addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const erros = [];
    for (const file of files) {
      try {
        STATE.dados.equipamentos.arquivos.push(await lerArquivo(file, LIMITES_MB.lista));
      } catch (err) {
        erros.push(err.message);
      }
    }
    salvar();
    ETAPAS[6].render(wrap);
    if (erros.length) alert(erros.join('\n\n'));
  });

  // Remover um arquivo da lista
  qsa('[data-remover-equipamento]', wrap).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const idx = +btn.dataset.removerEquipamento;
      STATE.dados.equipamentos.arquivos.splice(idx, 1);
      salvar();
      ETAPAS[6].render(wrap);
    });
  });
}

function bindTom(wrap) {
  const d = STATE.dados.tom;
  qs('select[name="tom"]', wrap).addEventListener('change', e => { d.tom = e.target.value; salvar(); });
  qsa('input[data-ref]', wrap).forEach(input => {
    input.addEventListener('input', () => { d.referencias[+input.dataset.ref] = input.value; salvar(); });
  });
  qs('input[name="evitar"]', wrap).addEventListener('input', e => { d.evitar = e.target.value; salvar(); });
  qs('textarea[name="observacoes"]', wrap).addEventListener('input', e => { d.observacoes = e.target.value; salvar(); });
}

/* =========================================================
   Render helpers
   ========================================================= */

function iconeArquivo(arq) {
  const nome = (arq.nome || '').toLowerCase();
  const tipo = arq.tipo || '';
  if (tipo === 'application/pdf' || nome.endsWith('.pdf')) return 'fa-file-pdf';
  if (/\.(xlsx?|csv)$/.test(nome) || tipo.includes('excel') || tipo.includes('spreadsheet') || tipo === 'text/csv') return 'fa-file-excel';
  if (/\.docx?$/.test(nome) || tipo.includes('word') || tipo.includes('document')) return 'fa-file-word';
  return 'fa-file';
}

function ehImagem(arq) {
  const nome = (arq.nome || '').toLowerCase();
  return (arq.tipo || '').startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/.test(nome);
}

function renderUploadPreview(arq, contexto, idx) {
  // Imagem com dataURL disponivel -> miniatura; senao mostra um icone por tipo.
  const mediaHTML = (ehImagem(arq) && arq.dataURL)
    ? `<img src="${arq.dataURL}" alt="">`
    : `<div class="upload__preview-icon"><i class="fa-solid ${iconeArquivo(arq)}"></i></div>`;

  let removeAttr = '';
  if (contexto === 'logo') removeAttr = 'data-remover-upload="logo"';
  else if (contexto === 'equipamento') removeAttr = `data-remover-equipamento="${idx}"`;

  return `
    <div class="upload__preview">
      ${mediaHTML}
      <div class="upload__preview-info">
        <div class="upload__preview-name">${esc(arq.nome)}</div>
        <div class="upload__preview-size">${formatarTamanho(arq.tamanho)}</div>
      </div>
      <button type="button" class="upload__remove" ${removeAttr} title="Remover">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `;
}

function tomLabel(t) {
  const labels = { formal: 'Formal', 'proximo-tecnico': 'Próximo e técnico', 'proximo-informal': 'Próximo e informal' };
  return labels[t] || t || '—';
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =========================================================
   Validação + navegação
   ========================================================= */

function mostrarErros(erros) {
  const navHint = qs('#navbarHint');
  const msgs = Object.values(erros);
  if (msgs.length === 0) { navHint.textContent = ''; return; }
  navHint.innerHTML = `<span style="color:var(--danger);font-weight:500;">${msgs[0]}</span>`;
}

function proxima() {
  const validador = ETAPAS[STATE.etapa]?.validar;
  const erros = validador ? validador() : {};
  if (Object.keys(erros).length > 0) {
    mostrarErros(erros);
    return;
  }
  mostrarErros({});
  if (STATE.etapa < TOTAL_ETAPAS) {
    irPara(STATE.etapa + 1);
  } else {
    enviar();
  }
}

function anterior() {
  if (STATE.etapa > 1) {
    mostrarErros({});
    irPara(STATE.etapa - 1);
  }
}

/* =========================================================
   Enviar (MVP: simula e mostra JSON)
   ========================================================= */

function gerarPayloadFinal() {
  const d = STATE.dados;
  const paleta = (window.PALETAS || []).find(p => p.id === d.marca.paletaId);
  const fonte = (window.FONTES || []).find(f => f.id === d.tipografia.fonteId);

  return {
    versao: 1,
    geradoEm: new Date().toISOString(),
    cliente: {
      nome: d.identificacao.nome,
      slug: slug(d.identificacao.nome),
      slogan: d.identificacao.slogan,
      segmento: d.identificacao.segmento,
      regiao: d.identificacao.regiao,
      urlSiteAtual: d.identificacao.urlSiteAtual
    },
    contato: d.contato,
    marca: {
      logo: d.marca.logo ? { nome: d.marca.logo.nome, tipo: d.marca.logo.tipo, tamanho: d.marca.logo.tamanho, dataURL: d.marca.logo.dataURL } : null,
      paleta: paleta || null,
      corPrimaria: d.marca.corPrimaria || (paleta ? paleta.primary : null),
      corSecundaria: d.marca.corSecundaria || (paleta ? paleta.secondary : null)
    },
    tipografia: fonte || null,
    sobre: {
      anosMercado: +d.sobre.anosMercado || 0,
      textoInstitucional: d.sobre.textoInstitucional,
      diferenciais: d.sobre.diferenciais.filter(x => x.trim())
    },
    equipamentos: {
      arquivos: (d.equipamentos.arquivos || []).map(a => ({
        nome: a.nome,
        tipo: a.tipo,
        tamanho: a.tamanho,
        dataURL: a.dataURL
      }))
    },
    tom: {
      tom: d.tom.tom,
      referencias: d.tom.referencias.filter(x => x.trim()),
      evitar: d.tom.evitar,
      observacoes: d.tom.observacoes
    }
  };
}

const MODO_OFFLINE = location.protocol === 'file:' || location.hostname === '';

async function enviar() {
  // Validacao de tamanho total antes de tentar enviar
  const totalMB = tamanhoTotalBinarioMB();
  if (!MODO_OFFLINE && totalMB > MAX_PAYLOAD_BIN_MB) {
    STATE.view = 'erro';
    STATE.dados._erro = `Total de arquivos anexados: ${totalMB.toFixed(2)} MB. Limite: ${MAX_PAYLOAD_BIN_MB} MB. Volte e remova/comprima algum arquivo (use tinypng.com pra fotos, smallpdf.com pra PDFs).`;
    salvar();
    render();
    return;
  }

  STATE.view = 'enviando';
  salvar();
  render();

  const payload = gerarPayloadFinal();
  console.log('[Briefing Oduo] Payload final:', payload);

  if (MODO_OFFLINE) {
    // Modo offline (abrir index.html via file://): só simula o envio.
    await new Promise(r => setTimeout(r, 1500));
    STATE.view = 'sucesso';
    STATE.dados._resposta = { ok: true, offline: true };
    // Limpa o localStorage para o proximo cliente comecar fresh
    localStorage.removeItem(STORAGE_KEY);
    render();
    return;
  }

  // Modo conectado: POST de verdade pro backend Vercel
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      throw new Error(data.erro || (data.erros ? data.erros.join('; ') : `HTTP ${res.status}`));
    }

    STATE.view = 'sucesso';
    STATE.dados._resposta = data;
    // Sucesso: limpa o localStorage para o proximo cliente comecar fresh.
    // Mesmo se este cliente recarregar a pagina apos enviar, vai voltar
    // pra tela inicial - o que e o comportamento desejado.
    localStorage.removeItem(STORAGE_KEY);
    render();
  } catch (e) {
    console.error('[Briefing Oduo] Erro ao enviar:', e);
    STATE.view = 'erro';
    STATE.dados._erro = e.message;
    // Em caso de erro, MANTEM no localStorage para o cliente tentar de novo
    salvar();
    render();
  }
}

/* =========================================================
   Bootstrap
   ========================================================= */

function init() {
  carregar();
  // Bind nav (uma vez só — os botões persistem entre renders)
  qs('#btnVoltar').addEventListener('click', anterior);
  qs('#btnProximo').addEventListener('click', proxima);

  // Atalho de dev: Ctrl+Shift+R reseta tudo
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      if (confirm('Resetar o briefing? Isso apaga tudo.')) {
        resetar();
        irPara(0);
      }
    }
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);
