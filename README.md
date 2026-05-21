# Oduo LP Kit — App de Briefing

Mini-app web que substitui o Google Forms pra captação de briefings. Cliente preenche em 8 etapas (logo, paleta, fontes, produtos, fotos, PDFs); ao enviar, o backend cria automaticamente um repo `lp-{cliente}` privado na org `ODuo-Tech-Team` com tudo preenchido e notifica o time no Slack. O dev de plantão clona o repo, cola um prompt no Claude Code, e a LP fica pronta em ~20min.

**URL de produção:** https://oduo-lp-kit-app.vercel.app
**Repo do kit (templates + persona):** https://github.com/ODuo-Tech-Team/oduo-lp-kit

---

# 📋 Pra desenvolvedores (Alexandre, Fernando, Maurício)

Quando você recebe notificação no Slack `#briefings` de briefing novo, você é o "operador" que dispara a geração da LP no Claude Code. **1-2 minutos de trabalho ativo + 20min de espera enquanto o Claude trabalha sozinho.**

## ⚙️ Setup inicial (uma vez só na sua máquina Windows)

### 1. Instalar pré-requisitos

Abra **PowerShell como Administrador** e cole:

```powershell
# Git (controle de versão)
winget install --id Git.Git -e

# GitHub CLI (autenticação + clone fácil)
winget install --id GitHub.cli -e

# Node.js LTS (precisa pra alguns utilitários)
winget install --id OpenJS.NodeJS.LTS -e

# Visual Studio Code (IDE)
winget install --id Microsoft.VisualStudioCode -e
```

**Feche e reabra o PowerShell** depois pra os comandos `git`, `gh`, `node` e `code` ficarem no PATH.

### 2. Instalar o Claude Code

- Acesse https://claude.com/download
- Baixe e instale o **Claude Code Desktop** pra Windows
- Abra o app, faça login com a conta que tem a assinatura **Max** (a mesma usada no claude.ai)

### 3. Autenticar o GitHub CLI

```powershell
gh auth login
```

- Selecione **GitHub.com**
- Protocolo: **HTTPS**
- Autenticar com: **Login with a web browser**
- Cole o código que ele mostra → abre o navegador → autoriza
- Confirme: `gh auth status` deve dizer `Logged in to github.com`

Sua conta precisa ser **Member** ou **Owner** da org `ODuo-Tech-Team`. Se não for, peça pro Maurício adicionar você em https://github.com/orgs/ODuo-Tech-Team/people.

### 4. Clonar o kit (templates + persona) na sua máquina

Escolha um caminho de sua preferência. Recomendo `c:\dev\`:

```powershell
mkdir c:\dev -Force
cd c:\dev
gh repo clone ODuo-Tech-Team/oduo-lp-kit
```

Resultado: o kit fica em `c:\dev\oduo-lp-kit\`. **Cada dev pode escolher o caminho que quiser** — não precisa ser igual ao do colega.

### 5. Configurar a variável `ODUO_LP_KIT`

Essa variável aponta pro caminho onde **você** clonou o kit. O Claude lê ela pra achar a persona, templates, etc.

```powershell
[Environment]::SetEnvironmentVariable('ODUO_LP_KIT', 'c:\dev\oduo-lp-kit', 'User')
```

**Importante**: ajuste o caminho se você clonou em outro lugar.

Depois, **feche e abra um novo PowerShell** pra a variável ficar disponível. Confirme:

```powershell
echo $env:ODUO_LP_KIT
```

Deve imprimir `c:\dev\oduo-lp-kit`.

### 6. Pasta pra clones das LPs de clientes

Recomendado ter uma pasta dedicada onde você clona cada LP de cliente:

```powershell
mkdir c:\dev\clientes -Force
```

Cada cliente novo vai virar uma subpasta aqui.

---

## 🚀 A cada briefing novo (fluxo do dia a dia)

### 1. Notificação no Slack

Você recebe no canal `#briefings` algo tipo:

> 📋 **Briefing novo: Casa Verde Locação**
> Cliente: Casa Verde Locação
> Segmento: locação para construção civil
> Slug: `casa-verde-locacao`
> Repo: abrir no GitHub

### 2. Clone o repo do cliente

```powershell
cd c:\dev\clientes
gh repo clone ODuo-Tech-Team/lp-casa-verde-locacao
cd lp-casa-verde-locacao
```

(Substitua o slug pelo do cliente que chegou no Slack.)

### 3. Abra a pasta no VS Code

```powershell
code .
```

O `.` significa "pasta atual". O VS Code abre direto nela.

### 4. Olhe rapidamente o que veio

No painel **Explorer** do VS Code você vai ver:

```
lp-casa-verde-locacao/
├── assets/                    ← logo, fotos de produto, PDFs
├── briefing-cliente.md        ← briefing já preenchido (Claude vai ler)
├── briefing.json              ← dump cru pra debug
├── RODAR.md                   ← prompt pronto pra colar no Claude
└── README.md                  ← instruções rápidas
```

### 5. Abra o terminal integrado do VS Code

Atalho: **`` Ctrl + ` ``** (control + crase)

### 6. Inicie o Claude Code

No terminal do VS Code:

```powershell
claude
```

Vai aparecer a interface do Claude Code dentro do próprio VS Code.

### 7. Copie o prompt do RODAR.md

- No painel Explorer, **clique no `RODAR.md`** pra abrir
- Procure a seção **"## O PROMPT"** (~linha 36)
- Selecione **todo o texto entre os blocos de código** (```)
- **Ctrl + C**

### 8. Cole no Claude Code como primeira mensagem

- Clica na janela do Claude Code (terminal)
- **Ctrl + V**
- **Enter**

### 9. Vá pegar um café ☕

Claude vai executar as Etapas -1 a 5 da persona automaticamente:

- **-1 (~30s)**: Sync do kit (`git pull --rebase`)
- **0 (~2min)**: Calibração — escolhe combo de variantes, anchor visual, momentos WOW
- **1 (~3min)**: Lê o briefing
- **2 (~5min)**: Confere assets, busca foto de hero no Wikimedia se faltar
- **3 (~10min)**: Construção da LP (HTML + CSS + JS)
- **4 (~3min)**: Validação (checklist de craft, mobile, ortografia)
- **5 (~2min)**: Pede confirmação pra fazer commit + push do `historico-lps.md` no kit

**Total: ~20-25 minutos.** Você só precisa intervir se ele te perguntar algo (ex: "qual foto usar pro hero?").

### 10. Quando o Claude terminar

Ele vai te avisar com um resumo tipo:

> ✓ LP pronta. Combo: Hero B + Stats 3 + Sobre D + Produtos 1 + Diferenciais A.
> Anchor visual: tipografia gigante "EQUIPAMENTOS" cortando o hero.
> Validação: 6/7 itens de craft batidos.
> Sugiro `git add . && git commit -m "feat: LP Casa Verde" && git push` no repo do cliente.

### 11. Veja a LP no navegador

No VS Code, clique com botão direito no `index.html` → **Reveal in File Explorer** → dê duplo clique pra abrir no navegador.

Ou no terminal:

```powershell
Start-Process index.html
```

**Valide visualmente:**
- Hero carrega
- Mobile responsivo (DevTools → F12 → toggle device → 375px)
- Todos os botões de WhatsApp funcionam
- Não tem "Desenvolvido por Oduo" no footer
- Imagens carregam

### 12. Faça o commit + push da LP final

No terminal do VS Code:

```powershell
git add .
git commit -m "feat: LP Casa Verde Locacao"
git push
```

O push vai pro **mesmo repo** que você clonou (`lp-casa-verde-locacao`). É exatamente isso que queremos — todo o trabalho fica no repo do cliente.

### 13. Suba no Hostinger

1. Acesse https://hpanel.hostinger.com → seu site `oduo.com.br`
2. **Gerenciador de arquivos** → `public_html/clientes/`
3. **Nova pasta** com o nome `{slug}` (ex: `casa-verde-locacao`). Use kebab-case, sem espaços/acentos. Versões: `casa-verde-locacao-v2`, etc.
4. Entre na pasta nova
5. **Upload** → arraste os arquivos da pasta da LP: `index.html`, `styles.css`, `script.js`, e a pasta `assets/` inteira
6. Aguarde upload completar
7. Teste: abra `https://oduo.com.br/clientes/{slug}/` no navegador

### 14. Mande pro cliente

Pelo WhatsApp:

> Boa tarde, [Cliente]! Sua landing page tá no ar pra você aprovar:
> https://oduo.com.br/clientes/{slug}/
> Dá uma olhada e me avisa se tem algo pra ajustar 🙏

### 15. Marque o teste como concluído

No Slack `#briefings`, responda na thread do briefing com:

> ✅ LP do {Cliente} no ar — https://oduo.com.br/clientes/{slug}/

---

## 🔧 Atalhos úteis do VS Code

| Atalho | O que faz |
|---|---|
| `` Ctrl + ` `` | Abre/fecha terminal integrado |
| `Ctrl + Shift + P` | Command palette (busca qualquer comando) |
| `Ctrl + P` | Busca arquivo por nome |
| `Ctrl + Shift + F` | Busca texto em todos os arquivos do projeto |
| `Ctrl + ,` | Settings |
| `Ctrl + K + S` | Atalhos de teclado |
| `Alt + Shift + F` | Formata arquivo atual |

## 🆘 Se algo der errado

**Claude não acha o kit** — confira se a variável tá setada:
```powershell
echo $env:ODUO_LP_KIT
```
Se vazio, refaça o passo 5 do setup. Lembre de abrir novo PowerShell depois.

**`gh: command not found`** — winget instalou mas PATH não atualizou. Feche e abra novo PowerShell.

**`Permission denied (publickey)`** ao clonar — use HTTPS em vez de SSH, ou rode `gh auth setup-git`.

**Claude Code não abre** — verifique se você logou com a conta da assinatura **Max** (não Pro Free).

**LP gerada ficou genérica** — fala pro Claude regenerar mencionando o que tá errado. Ex: "regenere o hero com tipografia maior e use a paleta laranja queimado em vez da azul".

---

# 🛠️ Pra quem mantém o app de briefing (Maurício)

O app de briefing (este projeto) é o que o cliente preenche. Ele roda na Vercel. **Não precisa mexer com frequência** — só quando for adicionar feature.

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
│   ├── rodar-md.js                       # Gera RODAR.md (prompt pronto)
│   ├── github.js                         # GitHub API helpers
│   └── slack.js                          # Webhook
├── package.json, vercel.json
└── README.md (este arquivo)
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
| `GITHUB_TOKEN` | PAT classic com escopo `repo` | Criar repos `lp-{cliente}` na org |
| `GITHUB_ORG` | `ODuo-Tech-Team` | Org de destino |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | Notificação `#briefings` |

Pra atualizar: Vercel Dashboard → Settings → Environment Variables → editar → **Redeploy** o último deploy.

## Deploy

Push pra `main` no GitHub → Vercel auto-deploya em ~30s.

## Domínio custom

Vercel Dashboard → Settings → Domains → adicionar `briefing.oduo.com.br`. Configurar CNAME no DNS do `oduo.com.br` apontando pra `cname.vercel-dns.com`.

## Limites técnicos atuais

- **Payload máx**: ~4.5 MB total (Vercel Functions standalone). Frontend já valida no client antes de enviar.
- **Logo**: 500 KB
- **Foto de produto**: 800 KB
- **PDF de catálogo**: 1 MB
- **Função Vercel**: 60s timeout (configurado em `vercel.json`)

## Limitações conhecidas

- Etapa 6 (produtos) hoje é produto-por-produto. Pra clientes com 100+ produtos, é inviável. **TODO**: aceitar upload de CSV/Excel + ZIP de imagens.
- Notificação Slack é só "briefing chegou". Não tem notificação separada de "LP pronta" (o dev avisa manualmente no thread).

---

## 👥 Time

- **Mauricio Reis** (mantenedor) — mkt.oduo@gmail.com
- **Alexandre**
- **Fernando**
