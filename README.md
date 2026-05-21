# Oduo LP Kit — App de Briefing

Mini-app web pra cliente preencher o briefing da LP em vez do Google Forms. Ao terminar, envia tudo pro time Oduo, que constrói a LP no padrão Oduo em ~30min.

## Como rodar (dev)

Abre o `index.html` direto no navegador, ou:

```powershell
npx serve .
```

Sem build, sem `npm install`, sem framework. É HTML/CSS/JS puro — mesma stack do [oduo-lp-kit](https://github.com/ODuo-Tech-Team/oduo-lp-kit).

## Fases do projeto

- **Fase 1 (MVP — esta):** form local de 8 etapas, output em JSON no console e na tela
- **Fase 2:** backend serverless cria repo `lp-{cliente}` no GitHub com `briefing-cliente.md` preenchido + assets
- **Fase 3:** painel admin (4 devs) com geração de URLs únicas por cliente
- **Fase 4:** Slack webhook + deploy em `briefing.oduo.com.br`

## Estrutura

```
oduo-lp-kit-app/
├── index.html        form multi-step (8 etapas)
├── styles.css        visual padrão Oduo
├── script.js         lógica das etapas
└── data/
    ├── paletas.js    6 paletas catalogadas no kit
    └── fontes.js     3 combos de tipografia
```

## As 8 etapas

1. Identificação do cliente (nome, segmento, slogan, cidade)
2. Contato (WhatsApp, e-mail, endereço)
3. Logo + paleta de cor
4. Tipografia (3 combos com preview real)
5. Sobre a empresa (anos, texto, 3-6 diferenciais)
6. Produtos / serviços (3-6 cards com foto)
7. Tom e referências
8. Confirmação e envio

## Time

- Mauricio (mantenedor)
- Alexandre
- Fernando
