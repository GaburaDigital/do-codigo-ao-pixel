/* =========================================================================
   sw.js — Service worker.

   Estrategia:
     - Casca da aplicacao (HTML, CSS, JS, Blockly, icones): cache primeiro,
       com atualizacao em segundo plano. Abre rapido e funciona offline.
     - Artes e catalogo: rede primeiro, com o cache como reserva. Assim voce
       publica artes novas e elas aparecem sem o aluno precisar limpar nada.

   IMPORTANTE: ao publicar uma versao nova do site, mude o numero em VERSAO.
   Isso descarta os caches antigos e forca o download dos arquivos novos.
   ========================================================================= */

const VERSAO = 'v1.0.0';
const CACHE_CASCA = 'dcap-casca-' + VERSAO;
const CACHE_DADOS = 'dcap-dados-' + VERSAO;

const CASCA = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/base.css',
  'css/terminal.css',
  'css/layout.css',
  'js/app.js',
  'js/nucleo/estado.js',
  'js/nucleo/catalogo.js',
  'js/nucleo/cronometro.js',
  'js/nucleo/pontuacao.js',
  'js/grid/modelo.js',
  'js/grid/render.js',
  'js/exec/api-pixel.js',
  'js/exec/executor.js',
  'js/exec/reprodutor.js',
  'js/blocos/definicoes.js',
  'js/blocos/oficina.js',
  'js/modos/modos.js',
  'js/ui/icones.js',
  'js/ui/audio.js',
  'js/ui/boot.js',
  'js/ui/nova.js',
  'js/ui/ajustes.js',
  'js/ui/relatorio.js',
  'vendor/blockly/blockly_compressed.js',
  'vendor/blockly/blocks_compressed.js',
  'vendor/blockly/javascript_compressed.js',
  'vendor/blockly/msg-en.js',
  'vendor/blockly/msg-pt-br.js',
  'vendor/blockly/media/sprites.png',
  'vendor/blockly/media/sprites.svg',
  'vendor/blockly/media/delete-icon.svg',
  'vendor/blockly/media/dropdown-arrow.svg',
  'vendor/blockly/media/handopen.cur',
  'vendor/blockly/media/handclosed.cur',
  'vendor/blockly/media/1x1.gif',
  'assets/icones/favicon.svg',
  'assets/icones/icone-192.png',
  'assets/icones/icone-512.png',
  'assets/icones/apple-touch-icon.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_CASCA)
      .then((cache) => Promise.allSettled(CASCA.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes
          .filter((n) => n.startsWith('dcap-') && n !== CACHE_CASCA && n !== CACHE_DADOS)
          .map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

function ehDados(url) {
  return url.pathname.includes('/ATIVIDADES/') || url.pathname.endsWith('catalogo.json');
}

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (ehDados(url)) {
    // Rede primeiro: conteudo novo aparece assim que voce publica.
    evento.respondWith(
      fetch(req)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_DADOS).then((c) => c.put(req, copia));
          return resposta;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Casca: cache primeiro, atualizando por tras.
  evento.respondWith(
    caches.match(req).then((emCache) => {
      const daRede = fetch(req)
        .then((resposta) => {
          if (resposta && resposta.status === 200) {
            const copia = resposta.clone();
            caches.open(CACHE_CASCA).then((c) => c.put(req, copia));
          }
          return resposta;
        })
        .catch(() => emCache);
      return emCache || daRede;
    })
  );
});
