// Arquivo: functions/api/submit-score.js (Versão de Diagnóstico)

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    // DIAGNÓSTICO 1: Loga exatamente o corpo da requisição que chegou.
    console.log("BACKEND RECEBEU OS SEGUINTES DADOS:", JSON.stringify(data));

    const { name, email, score, consent } = data;

    // DIAGNÓSTICO 2: Loga os valores após serem extraídos.
    console.log(`Valores extraídos -> nome: ${name}, score: ${score} (tipo: ${typeof score}), consent: ${consent}`);

    if (!name || typeof score !== 'number' || consent !== true) {
      console.log("VALIDAÇÃO FALHOU! Retornando erro 400."); // DIAGNÓSTICO 3
      return new Response('Dados inválidos: nome, pontuação e consentimento são obrigatórios.', { status: 400 });
    }

    // ... (resto da lógica de salvar no banco de dados continua igual) ...
    const psSelect = env.DB.prepare('SELECT score FROM scores WHERE name = ?');
    const existing = await psSelect.bind(name).first();
    if (existing) {
      if (score > existing.score) {
        const psUpdate = env.DB.prepare('UPDATE scores SET score = ?, email = ?, consent_given = 1 WHERE name = ?');
        await psUpdate.bind(score, email || null, name).run();
        return new Response(JSON.stringify({ message: 'Recorde pessoal atualizado!' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else {
        return new Response(JSON.stringify({ message: 'Pontuação não superou o recorde pessoal.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      const psInsert = env.DB.prepare('INSERT INTO scores (name, email, score, consent_given) VALUES (?, ?, ?, 1)');
      await psInsert.bind(name, email || null, score).run();
      return new Response(JSON.stringify({ message: 'Pontuação salva com sucesso!' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (e) {
    console.error("ERRO NO CATCH DO BACKEND:", e);
    return new Response('Erro interno do servidor.', { status: 500 });
  }
}
