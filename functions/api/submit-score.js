// Arquivo: functions/api/submit-score.js (Versão 2.0 - com lógica de update)

export async function onRequestPost({ request, env }) {
  try {
    const { name, email, score } = await request.json();

    if (!name || typeof score !== 'number') {
      return new Response('Dados inválidos: nome e pontuação são obrigatórios.', { status: 400 });
    }

    // 1. Procura se já existe uma pontuação para este jogador (usando o nome como identificador único)
    const psSelect = env.DB.prepare('SELECT score FROM scores WHERE name = ?');
    const existing = await psSelect.bind(name).first();

    if (existing) {
      // 2. Se o jogador já existe, compara a pontuação
      if (score > existing.score) {
        // Se a nova pontuação é MAIOR, atualiza (sobrescreve)
        const psUpdate = env.DB.prepare('UPDATE scores SET score = ?, email = ? WHERE name = ?');
        await psUpdate.bind(score, email || null, name).run();
        return new Response(JSON.stringify({ message: 'Recorde pessoal atualizado!' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else {
        // Se a nova pontuação NÃO é maior, não faz nada
        return new Response(JSON.stringify({ message: 'Pontuação não superou o recorde pessoal.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      // 3. Se o jogador não existe, insere o novo registro
      const psInsert = env.DB.prepare('INSERT INTO scores (name, email, score) VALUES (?, ?, ?)');
      await psInsert.bind(name, email || null, score).run();
      return new Response(JSON.stringify({ message: 'Pontuação salva com sucesso!' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (e) {
    console.error(e);
    return new Response('Erro interno do servidor.', { status: 500 });
  }
}
