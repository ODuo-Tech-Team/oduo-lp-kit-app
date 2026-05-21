# Oduo LP Kit — App de Briefing

Mini-app web que substitui o Google Forms pra captação de briefings. Cliente preenche em 8 etapas; ao enviar, o backend cria automaticamente um repo `lp-{cliente}` privado na org `ODuo-Tech-Team` com tudo preenchido e notifica o time no Slack. O dev de plantão clona o repo, cola um prompt no Claude Code, e a LP fica pronta em ~20min.

**URL de produção:** https://oduo-lp-kit-app.vercel.app
**Repo do kit (templates + persona):** https://github.com/ODuo-Tech-Team/oduo-lp-kit

---

# 📋 Pra devs do time (Alexandre, Fernando, Maurício)

Quando chega notificação no Slack `#briefings`, você é o "operador" que dispara a geração da LP no Claude Code. **1-2 minutos de trabalho ativo + ~20min de espera.**

## ⚙️ Setup específico deste projeto (uma vez só)

### 1. Clone o kit (templates + persona) onde preferir

```powershell
gh repo clone ODuo-Tech-Team/oduo-lp-kit c:\dev\oduo-lp-kit
```

Pode usar qualquer caminho — cada dev escolhe o seu.

### 2. Configure a variável `ODUO_LP_KIT`

Aponta pra onde **você** clonou o kit. O Claude lê essa variável pra achar persona, templates e histórico.

```powershell
[Environment]::SetEnvironmentVariable('ODUO_LP_KIT', 'c:\dev\oduo-lp-kit', 'User')
```

Ajuste o caminho se clonou em outro lugar. **Feche e abra um novo PowerShell** depois. Confira:

```powershell
echo $env:ODUO_LP_KIT
```

### 3. Pasta dedicada pra clones de LPs (opcional, mas organiza)

```powershell
mkdir c:\dev\clientes -Force
```

---

## 🚀 Fluxo a cada briefing novo

### 1. Notificação chega no Slack `#briefings`

```
📋 Briefing novo: Casa Verde Locação
Segmento: locação para construção civil
Slug: casa-verde-locacao
Repo: abrir no GitHub
```

### 2. Clone o repo do cliente

```powershell
cd c:\dev\clientes
gh repo clone ODuo-Tech-Team/lp-casa-verde-locacao
cd lp-casa-verde-locacao
```

### 3. Abra o VS Code na pasta

```powershell
code .
```

Você vai ver o que veio do backend:

```
lp-casa-verde-locacao/
├── assets/                 ← logo, fotos, PDFs anexados pelo cliente
├── briefing-cliente.md     ← briefing preenchido (Claude vai ler)
├── briefing.json           ← dump cru pra debug
├── RODAR.md                ← prompt pronto pra colar no Claude
└── README.md
```

### 4. Abra o terminal integrado do VS Code

Atalho: **`` Ctrl + ` ``** (control + crase).

### 5. Inicie o Claude Code

```powershell
claude
```

### 6. Copie o prompt do `RODAR.md`

- Clica no `RODAR.md` no painel Explorer
- Procure a seção **"## O PROMPT"** (~linha 36)
- Selecione **tudo entre os blocos de código** ```` ``` ````
- **Ctrl + C**

### 7. Cole no Claude Code como primeira mensagem

- Clica na janela do Claude Code (terminal)
- **Ctrl + V** → **Enter**

### 8. Vá pegar um café ☕

Claude vai executar as Etapas -1 a 5 da persona automaticamente:

- **-1**: Sync do kit (`git pull --rebase`)
- **0**: Calibração — combo de variantes, anchor visual, momentos WOW
- **1**: Lê o briefing
- **2**: Confere assets (busca foto de hero no Wikimedia se faltar)
- **3**: Construção da LP (HTML + CSS + JS)
- **4**: Validação (craft, mobile, ortografia)
- **5**: Pede confirmação pra commit + push do `historico-lps.md` no kit

**Total: ~20-25 minutos.** Só intervém se ele te perguntar algo.

### 9. Quando terminar, abra o `index.html` no navegador

```powershell
Start-Process index.html
```

Valide:
- Hero carrega
- Mobile responsivo (F12 → toggle device → 375px)
- Botões de WhatsApp funcionam
- Sem "Desenvolvido por Oduo" no footer

### 10. Faça commit + push da LP

No terminal do VS Code:

```powershell
git add .
git commit -m "feat: LP Casa Verde Locacao"
git push
```

O push vai pro **mesmo repo** que você clonou (`lp-casa-verde-locacao`). Todo o trabalho fica no repo do cliente.

### 11. Suba no Hostinger

1. https://hpanel.hostinger.com → `oduo.com.br` → **Gerenciador de arquivos**
2. Vai pra `public_html/clientes/`
3. **Nova pasta** com o slug do cliente (kebab-case, ex: `casa-verde-locacao`). Versões: `-v2`, `-v3`.
4. Entra na pasta nova
5. **Upload** → arraste: `index.html`, `styles.css`, `script.js`, e a pasta `assets/` inteira
6. Teste: `https://oduo.com.br/clientes/{slug}/`

### 12. Mande pro cliente no WhatsApp

> Boa tarde, [Cliente]! Sua landing page tá no ar pra você aprovar:
> https://oduo.com.br/clientes/{slug}/
> Dá uma olhada e me avisa se tem algo pra ajustar 🙏

### 13. Marque como pronta no Slack

Responde na thread do briefing:

> ✅ LP no ar — https://oduo.com.br/clientes/{slug}/

---

## 🔧 Atalhos úteis do VS Code

| Atalho | O que faz |
|---|---|
| `` Ctrl + ` `` | Abre/fecha terminal integrado |
| `Ctrl + Shift + P` | Command palette |
| `Ctrl + P` | Busca arquivo por nome |
| `Ctrl + Shift + F` | Busca texto em todos os arquivos |

## 🆘 Troubleshooting

**Claude não acha o kit** — confira `echo $env:ODUO_LP_KIT`. Se vazio, refaça o passo 2 do setup e abra novo PowerShell.

**LP gerada ficou genérica** — fala pro Claude regenerar mencionando o que tá errado. Ex: "regenere o hero com tipografia maior e use a paleta laranja queimado em vez da azul".

**Acesso negado no `gh repo clone`** — sua conta precisa ser Member da org `ODuo-Tech-Team`. Peça pro Maurício adicionar você em https://github.com/orgs/ODuo-Tech-Team/people.

---

# 🛠️ Pra quem mantém o app de briefing (Maurício)

O app de briefing (este projeto) é o que o cliente preenche. Roda na Vercel. **Não precisa mexer com frequência** — só pra adicionar feature.

## Stack

- Frontend: HTML/CSS/JS puro (sem build, sem npm)
- Backend: Vercel Functions (Node 22, ESM, fetch nativo)
- Storage: GitHub API (cria repo `lp-{cliente}` + commit batch)
- Notificação: Slack Incoming Webhook

## Estrutura

```
oduo-lp-kit-app/
├── index.html, styles.css, script.js     # Frontend
├── data/paletas.js, data/fontes.js       # Catálogos
├── api/submit.js                         # Vercel Function
├── lib/
│   ├── payload.js                        # Validação + slug
│   ├── briefing-md.js                    # Gera briefing-cliente.md
│   ├── rodar-md.js                       # Gera RODAR.md
│   ├── github.js                         # GitHub API helpers
│   └── slack.js                          # Webhook
├── package.json, vercel.json
└── README.md
```

## Rodar local (modo dev completo)

```powershell
cd c:\Users\mauri\Desktop\Projetos_Oduo\oduo-lp-kit-app
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

Abre http://localhost:3000.

## Variáveis de ambiente (Vercel Dashboard)

| Key | Valor | Pra quê |
|---|---|---|
| `GITHUB_TOKEN` | PAT classic com escopo `repo` | Criar repos `lp-{cliente}` |
| `GITHUB_ORG` | `ODuo-Tech-Team` | Org de destino |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | Notificação `#briefings` |

Pra atualizar: Settings → Environment Variables → editar → **Redeploy**.

## Deploy

Push pra `main` → Vercel auto-deploya em ~30s.

## Domínio custom

Settings → Domains → adicionar `briefing.oduo.com.br`. Configurar CNAME no DNS do `oduo.com.br` apontando pra `cname.vercel-dns.com`.

## Limites técnicos

- **Payload máx**: ~4.5 MB total (Vercel Functions standalone)
- **Logo**: 500 KB / **Foto produto**: 800 KB / **PDF**: 1 MB
- **Função**: 60s timeout

## Limitações conhecidas

- Etapa 6 (produtos) é produto-por-produto. **TODO**: aceitar CSV/Excel + ZIP de imagens.

---

## 👥 Time

- **Mauricio Reis** (mantenedor) — mkt.oduo@gmail.com
- **Alexandre**
- **Fernando**
