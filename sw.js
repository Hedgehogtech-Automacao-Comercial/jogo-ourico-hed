const CACHE_NAME = 'hed-pdv-game-v1';
// Lista de todos os arquivos que o jogo precisa para funcionar offline.
const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './imagens/hedgehog-sprite.png',
  './imagens/hedgehog-attack.png',
  './imagens/ground.png',
  './imagens/clouds.png',
  './imagens/explosion-sprite.png',
  './imagens/item-codigo.png',
  './imagens/item-ferramenta.png',
  './imagens/obstaculo-bug.png',
  './imagens/icon-192.png',
  './imagens/icon-512.png',
  './sons/music.mp3',
  './sons/jump.wav',
  './sons/collect.wav',
  './sons/gameover.wav',
  './sons/explosion.wav',
  './sons/powerUp.wav'
];

// Evento de instalação: abre o cache e adiciona todos os assets.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto, adicionando assets...');
        return cache.addAll(assetsToCache);
      })
  );
});

// Evento de fetch: intercepta os pedidos de rede.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso estiver no cache, retorna ele.
        if (response) {
          return response;
        }
        // Se não, busca na rede.
        return fetch(event.request);
      })
  );
});
