// Notificacao via Slack Incoming Webhook.
// Falhar aqui nao deve quebrar o fluxo (o repo ja foi criado).

export async function notificarBriefingNovo({ webhookUrl, cliente, segmento, repoUrl, slug }) {
  if (!webhookUrl) return { ok: false, motivo: 'sem webhook configurado' };

  const payload = {
    text: `Briefing novo: ${cliente}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `📋 Briefing novo: ${cliente}` }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Cliente:*\n${cliente}` },
          { type: 'mrkdwn', text: `*Segmento:*\n${segmento || '—'}` },
          { type: 'mrkdwn', text: `*Slug:*\n\`${slug}\`` },
          { type: 'mrkdwn', text: `*Repo:*\n<${repoUrl}|abrir no GitHub>` }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Próximo passo:* clone o repo, abra Claude Code, cole o prompt do `RODAR.md`. ~20min de execução.'
        }
      },
      { type: 'divider' }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return { ok: false, motivo: `Slack HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e.message };
  }
}
