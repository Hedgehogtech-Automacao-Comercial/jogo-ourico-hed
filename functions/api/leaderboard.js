// Arquivo: functions/api/leaderboard.js

/**
 * Define a função que responde a requisições GET.
 * @param {object} context - Contém o ambiente (env).
 */
export async function onRequestGet({ env }) {
  try {
    // 1. Conecta-se ao banco de dados D1 (vinculado como 'DB').
    // Prepara um comando SQL para selecionar nome e pontuação,
    // ordenando pela pontuação em ordem decrescente (do maior para o menor)
    // e pegando apenas os 10 primeiros resultados.
    const ps = env.DB.prepare(
      'SELECT name, score FROM scores ORDER BY score DESC LIMIT 10'
    );

    // 2. Executa a consulta e pega os resultados.
    const { results } = await ps.all();

    // 3. Retorna os resultados como um JSON para o jogo.
    // O navegador receberá uma lista de objetos, cada um com 'name' e 'score'.
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    // Em caso de qualquer erro, retorna uma mensagem de erro genérica.
    console.error(e); // Loga o erro real no console da Cloudflare para depuração
    return new Response('Erro ao buscar o ranking.', { status: 500 });
  }
}
