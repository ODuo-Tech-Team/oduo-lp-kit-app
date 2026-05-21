# Oduo LP Kit — App de Briefing

Mini-app web pra cliente preencher o briefing da LP em vez do Google Forms. Ao enviar, o backend cria automaticamente um repo `lp-{cliente}` privado na org ODuo-Tech-Team com tudo preenchido + notifica o time no Slack. O dev clona o repo, cola um prompt no Claude Code (com a assinatura Max), e a LP fica pronta em ~20min.

**Stack:** HTML/CSS/JS puro (frontend) + Vercel Function (backend) + GitHub API + Slack webhook. **Zero custo recorrente.**

---

## Como rodar local (offline, sem backend)

Abra o `index.html` direto no navegador. O app detecta `file://` e roda em modo offline — gera o JSON no console mas não chama o backend.

```powershell
Start-Process index.html
```

## Como rodar local com backend (modo dev completo)

Requer Node 18+ e a CLI da Vercel:

```powershell
npm i -g vercel
cd c:\Users\mauri\Desktop\Projetos_Oduo\oduo-lp-kit-app
vercel link    # vincula com o projeto na Vercel (uma vez)
vercel env pull .env.local   # baixa secrets configurados
vercel dev
```

Abra `http://localhost:3000`. Agora o app envia POST real pro backend local.

---

## Deploy na Vercel (uma vez)

### 1. Push deste repo pro GitHub

```powershell
gh repo create ODuo-Tech-Team/oduo-lp-kit-app --public --source=. --remote=origin --push
```

### 2. Conecte com a Vercel

- Acesse https://vercel.com/new
- Importe o repo `ODuo-Tech-Team/oduo-lp-kit-app`
- Framework: **Other** (não precisa de build)
- Deploy

### 3. Configure os secrets

No dashboard do projeto na Vercel → **Settings** → **Environment Variables**, adicione:

| Variável | Valor | Pra quê |
|---|---|---|
| `GITHUB_TOKEN` | `ghp_...` (PAT com escopo `repo`) | Criar repos `lp-{cliente}` |
| `GITHUB_ORG` | `ODuo-Tech-Team` | Org de destino |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | Notificação no canal `#briefings` |
| `ALLOWED_ORIGIN` | `https://briefing.oduo.com.br` (em prod) | CORS — use `*` em dev |

Depois de configurar, faça **Redeploy** pra os secrets serem aplicados.

### 4. Domínio custom (opcional)

No dashboard Vercel → **Domains** → adicione `briefing.oduo.com.br`. Vai te dar instruções de DNS (CNAME) pra configurar no provedor do `oduo.com.br`.

---

## Estrutura

```
oduo-lp-kit-app/
├── index.html              form multi-step (8 etapas)
├── styles.css              visual padrão Oduo
├── script.js               lógica das etapas + POST pro backend
├── data/
│   ├── paletas.js          6 paletas catalogadas
│   └── fontes.js           3 combos de tipografia
├── api/
│   └── submit.js           Vercel Function (recebe briefing, cria repo, notifica Slack)
├── lib/
│   ├── payload.js          validação + slug + decodeDataURL
│   ├── briefing-md.js      gera briefing-cliente.md a partir do JSON
│   ├── rodar-md.js         gera RODAR.md com prompt pronto pro dev
│   ├── github.js           helpers de GitHub API (criar repo, commit batch)
│   └── slack.js            webhook
├── package.json
├── vercel.json
├── .vercelignore
└── .gitignore
```

## Fluxo end-to-end

```
1. Cliente abre briefing.oduo.com.br
2. Preenche 8 etapas (cor, fonte, logo, produtos, PDFs)
3. Clica "Enviar briefing"
        ↓
4. Frontend POST /api/submit com o JSON completo (logo e fotos em base64)
        ↓
5. Backend (api/submit.js):
   - Valida payload
   - Cria repo lp-{slug} privado na ODuo-Tech-Team
   - Faz 1 commit batch com:
     • briefing-cliente.md preenchido
     • briefing.json (cru, pra debug)
     • RODAR.md (prompt pronto pro dev colar)
     • assets/logo.png, assets/{produto}.jpg, assets/{produto}-catalogo.pdf
     • README.md do repo
   - Notifica Slack #briefings: "Briefing novo: {Cliente} — link do repo"
        ↓
6. Cliente vê tela "Briefing enviado, em até 30min"
        ↓
7. Dev recebe Slack
   - Clica no link do repo
   - git clone, abre Claude Code, cola prompt do RODAR.md
   - Vai pegar café — Claude faz tudo em ~20min
   - Volta, valida, git push da LP pronta
        ↓
8. Outro dev (ou o mesmo) pega Slack de "LP pronta"
   - Sobe a pasta no Hostinger em public_html/clientes/{slug}/
   - Manda URL pro cliente no WhatsApp
```

## As 8 etapas do briefing

1. Identificação do cliente (nome, segmento, slogan, cidade)
2. Contato (WhatsApp, e-mail, endereço)
3. Logo + paleta de cor
4. Tipografia (3 combos com preview real)
5. Sobre a empresa (anos, texto, 3-6 diferenciais)
6. Produtos / serviços (3-6 cards com foto + catálogo PDF opcional)
7. Tom e referências
8. Confirmação e envio

## Limites técnicos

- Payload max: 100 MB (suficiente pra logo + 6 fotos + 6 PDFs típicos)
- Repos privados na org → Actions cobram, mas 3000 min/mês grátis cobre ~300 LPs/mês
- Função Vercel: 60s timeout (free tier dá 10s — pode precisar upgrade pra LPs com muitos assets)

## Time

- Mauricio (mantenedor)
- Alexandre
- Fernando
