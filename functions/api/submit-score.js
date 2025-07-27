// Arquivo: functions/api/submit-score.js
// Versão Final: Inclui lógica de update de recorde e registro de consentimento LGPD.

export async function onRequestPost({ request, env }) {
  try {
    // 1. Pega os dados JSON enviados pelo jogo, incluindo o novo campo 'consent'.
    const { name, email, score, consent } = await request.json();

    // 2. Validação dos dados recebidos. Agora, o consentimento é obrigatório.
    if (!name || typeof score !== 'number' || consent !== true) {
      return new Response('Dados inválidos: nome, pontuação e consentimento são obrigatórios.', { 
        status: 400 
      });
    }

    // 3. Procura se já existe uma pontuação para este jogador.
    const psSelect = env.DB.prepare('SELECT score FROM scores WHERE name = ?');
    const existing = await psSelect.bind(name).first();

    if (existing) {
      // 4. Se o jogador já existe, compara a pontuação.
      if (score > existing.score) {
        // Se a nova pontuação é MAIOR, atualiza (sobrescreve) o score e o email.
        // O consentimento já foi dado anteriormente.
        const psUpdate = env.DB.prepare('UPDATE scores SET score = ?, email = ? WHERE name = ?');
        await psUpdate.bind(score, email || null, name).run();
        
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
      // 5. Se o jogador não existe, insere o novo registro com o consentimento.
      // A coluna 'consent_given' receberá o valor 1 (verdadeiro).
      const psInsert = env.DB.prepare(
        'INSERT INTO scores (name, email, score, consent_given) VALUES (?, ?, ?, 1)'
      );
      await psInsert.bind(name, email || null, score).run();
      
      return new Response(JSON.stringify({ message: 'Pontuação salva com sucesso!' }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

  } catch (e) {
    // Em caso de qualquer erro no processo, loga o erro e retorna uma resposta genérica.
    console.error(e);
    return new Response('Erro interno do servidor.', { status: 500 });
  }
}
