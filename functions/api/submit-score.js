// Arquivo: functions/api/submit-score.js
// Versão 3.0: Lógica centrada no E-MAIL como identificador único.

export async function onRequestPost({ request, env }) {
  try {
    const { name, email, score, consent } = await request.json();

    // 1. Validação rigorosa dos dados recebidos. O e-mail agora é obrigatório.
    if (!name || !email || typeof score !== 'number' || consent !== true) {
      return new Response('Dados inválidos: nome, e-mail, pontuação e consentimento são obrigatórios.', { 
        status: 400 
      });
    }

    // 2. Procura se já existe uma pontuação para este E-MAIL.
    // Selecionamos também o nome, caso o jogador decida mudá-lo.
    const psSelect = env.DB.prepare('SELECT name, score FROM scores WHERE email = ?');
    const existingPlayer = await psSelect.bind(email).first();

    if (existingPlayer) {
      // 3. Se o jogador já existe (pelo e-mail), compara a pontuação.
      if (score > existingPlayer.score) {
        // Se a nova pontuação é MAIOR, atualiza (sobrescreve) o score e o nome.
        const psUpdate = env.DB.prepare('UPDATE scores SET score = ?, name = ? WHERE email = ?');
        await psUpdate.bind(score, name, email).run();
        
        return new Response(JSON.stringify({ message: 'Recorde pessoal atualizado!' }), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      } else {
        // Se a nova pontuação NÃO é maior, não faz nada.
        return new Response(JSON.stringify({ message: 'Pontuação não superou o recorde pessoal.' }), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    } else {
      // 4. Se o jogador não existe, insere o novo registro.
      const psInsert = env.DB.prepare(
        'INSERT INTO scores (name, email, score, consent_given) VALUES (?, ?, ?, 1)'
      );
      await psInsert.bind(name, email, score).run();
      
      return new Response(JSON.stringify({ message: 'Pontuação salva com sucesso!' }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

  } catch (e) {
    // Se o erro for de violação de unicidade (UNIQUE constraint failed), significa que o e-mail já existe.
    // Em um sistema maior, trataríamos isso de forma mais específica, mas para nosso caso, o fluxo acima já cobre.
    console.error(e);
    return new Response('Erro interno do servidor.', { status: 500 });
  }
}
