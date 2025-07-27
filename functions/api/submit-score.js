// Arquivo: functions/api/submit-score.js

export async function onRequestPost({ request, env }) {
  try {
    const { name, email, score, consent } = await request.json();

    // ATUALIZAÇÃO: Validação agora inclui a verificação do e-mail
    if (!name || !email || typeof score !== 'number' || consent !== true) {
      return new Response('Dados inválidos: nome, e-mail, pontuação e consentimento são obrigatórios.', { 
        status: 400 
      });
    }

    const psSelect = env.DB.prepare('SELECT score FROM scores WHERE name = ?');
    const existing = await psSelect.bind(name).first();

    if (existing) {
      if (score > existing.score) {
        const psUpdate = env.DB.prepare('UPDATE scores SET score = ?, email = ? WHERE name = ?');
        await psUpdate.bind(score, email, name).run(); // Removido '|| null' pois email é obrigatório
        
        return new Response(JSON.stringify({ message: 'Recorde pessoal atualizado!' }), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      } else {
        return new Response(JSON.stringify({ message: 'Pontuação não superou o recorde pessoal.' }), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    } else {
      const psInsert = env.DB.prepare(
        'INSERT INTO scores (name, email, score, consent_given) VALUES (?, ?, ?, 1)'
      );
      await psInsert.bind(name, email, score).run(); // Removido '|| null'
      
      return new Response(JSON.stringify({ message: 'Pontuação salva com sucesso!' }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

  } catch (e) {
    console.error(e);
    return new Response('Erro interno do servidor.', { status: 500 });
  }
}
