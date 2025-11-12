// Service Worker para PokéTech PWA
const CACHE_NAME = 'poketech-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/app.js',
  '/js/config_utils.js',
  '/js/battle_core.js',
  '/js/game_logic.js',
  '/js/renderer.js',
  '/js/renderer_core.js',
  '/js/renderer_menus.js',
  '/js/renderer_pokemon.js',
  '/js/renderer_services.js',
  '/js/auth_setup.js',
  '/js/map_core.js',
  '/js/pvp_core.js',
  '/js/poke_chat.js',
  '/js/poke_friendship.js',
  '/js/local_poke_data.js',
  '/js/branched_evos.js',
  '/js/evolution_rules.js',
  '/game_updates.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.warn('Service Worker: Erro ao cachear arquivos', err);
      })
  );
  self.skipWaiting(); // Força ativação imediata
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Assume controle imediato de todas as páginas
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignora requisições do Firebase e APIs externas
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('cdnjs.cloudflare.com') ||
      event.request.url.includes('unpkg.com') ||
      event.request.url.includes('open-meteo.com') ||
      event.request.url.includes('github.com') ||
      event.request.url.includes('pinimg.com') ||
      event.request.url.includes('jetta.vgmtreasurechest.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona a resposta para poder cachear
        const responseToCache = response.clone();
        
        // Cacheia apenas respostas válidas
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Fallback para cache se a rede falhar
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Se não encontrar no cache, retorna resposta básica
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

