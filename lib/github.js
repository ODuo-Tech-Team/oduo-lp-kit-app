// Helpers para criar repo + commit batch atomico via GitHub API.
// Usa fetch puro (Node 18+, Vercel runtime). Sem dependencias.

const GH_API = 'https://api.github.com';

async function gh(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${GH_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }

  if (!res.ok) {
    const msg = json?.message || `HTTP ${res.status}`;
    const err = new Error(`GitHub API ${method} ${path} falhou: ${msg}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function criarRepo({ org, nome, descricao = '', privado = true, token }) {
  return gh(`/orgs/${org}/repos`, {
    token,
    method: 'POST',
    body: {
      name: nome,
      description: descricao,
      private: !!privado,
      auto_init: true,
      has_issues: false,
      has_projects: false,
      has_wiki: false
    }
  });
}

export async function repoExiste({ org, nome, token }) {
  try {
    await gh(`/repos/${org}/${nome}`, { token });
    return true;
  } catch (e) {
    if (e.status === 404) return false;
    throw e;
  }
}

// Faz 1 commit batch com varios arquivos (utf-8 ou binarios via base64).
// files = [{ path: 'a/b.txt', content: '...', encoding: 'utf-8' | 'base64' }]
export async function commitBatch({ org, repo, branch = 'main', files, mensagem, token }) {
  // 1. pega SHA atual da branch
  const ref = await gh(`/repos/${org}/${repo}/git/ref/heads/${branch}`, { token });
  const parentSha = ref.object.sha;

  // 2. pega tree base
  const parentCommit = await gh(`/repos/${org}/${repo}/git/commits/${parentSha}`, { token });
  const baseTreeSha = parentCommit.tree.sha;

  // 3. cria blobs em paralelo (resiliente: pode ter muitos)
  const blobs = await Promise.all(files.map(async (file) => {
    const blob = await gh(`/repos/${org}/${repo}/git/blobs`, {
      token,
      method: 'POST',
      body: {
        content: file.content,
        encoding: file.encoding === 'base64' ? 'base64' : 'utf-8'
      }
    });
    return { path: file.path, sha: blob.sha, mode: '100644', type: 'blob' };
  }));

  // 4. cria tree (delta sobre a base)
  const tree = await gh(`/repos/${org}/${repo}/git/trees`, {
    token,
    method: 'POST',
    body: { base_tree: baseTreeSha, tree: blobs }
  });

  // 5. cria commit
  const novoCommit = await gh(`/repos/${org}/${repo}/git/commits`, {
    token,
    method: 'POST',
    body: { message: mensagem, tree: tree.sha, parents: [parentSha] }
  });

  // 6. atualiza ref
  await gh(`/repos/${org}/${repo}/git/refs/heads/${branch}`, {
    token,
    method: 'PATCH',
    body: { sha: novoCommit.sha }
  });

  return { commitSha: novoCommit.sha, htmlUrl: `https://github.com/${org}/${repo}/commit/${novoCommit.sha}` };
}
