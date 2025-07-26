// Arquivo: functions/api/submit-score.js

/**
 * Define a função que responde a requisições POST.
 * @param {object} context - Contém a requisição (request) e o ambiente (env).
 */
export async function onRequestPost({ request, env }) {
  try {
    // 1. Pega os dados JSON enviados pelo jogo.
    const data = await request.json();
    const { name, email, score } = data;

    // 2. Validação simples para garantir que os dados essenciais chegaram.
    if (!name || typeof score !== 'number') {
      return new Response('Dados inválidos: nome e pontuação são obrigatórios.', { status: 400 });
    }

    // 3. Conecta-se ao banco de dados D1 (vinculado como 'DB' nas configurações).
    // Prepara um comando SQL seguro para evitar injeção de SQL.
    const ps = env.DB.prepare(
      'INSERT INTO scores (name, email, score) VALUES (?, ?, ?)'
    );

    // 4. Executa o comando, inserindo os dados no banco de dados.
    await ps.bind(name, email || null, score).run();

    // 5. Retorna uma resposta de sucesso para o jogo.
    return new Response(JSON.stringify({ message: 'Pontuação salva com sucesso!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    // Em caso de qualquer erro, retorna uma mensagem de erro genérica.
    console.error(e); // Loga o erro real no console da Cloudflare para depuração
    return new Response('Erro interno do servidor.', { status: 500 });
  }
}
