/* =========================================================================
   icones.js — Icones em SVG com traco reto, estilo de interface dos anos
   1990 e 2000. Predominancia de cinza, com detalhes em ciano ou verde.
   Nenhum emoji em lugar nenhum da aplicacao.
   ========================================================================= */

const C = 'var(--icone)';
const D = 'var(--icone-detalhe)';
const V = 'var(--verde)';

function svg(conteudo, tamanho = 16, titulo = '') {
  return (
    '<svg viewBox="0 0 16 16" width="' + tamanho + '" height="' + tamanho +
    '" fill="none" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' +
    (titulo ? '<title>' + titulo + '</title>' : '') + conteudo + '</svg>'
  );
}

export const ICONES = {
  rodar: () => svg(
    '<path d="M4 2 L13 8 L4 14 Z" fill="' + V + '"/>' +
    '<path d="M4 2 L13 8 L4 14 Z" stroke="' + C + '" stroke-width="1"/>'
  ),
  parar: () => svg(
    '<rect x="3" y="3" width="10" height="10" fill="var(--vermelho)" stroke="' + C + '"/>'
  ),
  pausar: () => svg(
    '<rect x="4" y="3" width="3" height="10" fill="' + C + '"/>' +
    '<rect x="9" y="3" width="3" height="10" fill="' + C + '"/>'
  ),
  retomar: () => svg('<path d="M5 3 L12 8 L5 13 Z" fill="' + C + '"/>'),
  reiniciar: () => svg(
    '<path d="M13 8 A5 5 0 1 1 8 3" stroke="' + C + '" stroke-width="1.6"/>' +
    '<path d="M8 0.5 L8 5.5 L4.5 3 Z" fill="' + D + '"/>'
  ),
  avancar: () => svg(
    '<path d="M3 3 L9 8 L3 13 Z" fill="' + C + '"/>' +
    '<rect x="10" y="3" width="2.5" height="10" fill="' + D + '"/>'
  ),
  limpar: () => svg(
    '<rect x="3" y="5" width="10" height="9" stroke="' + C + '" stroke-width="1.4"/>' +
    '<rect x="5" y="2" width="6" height="2" fill="' + C + '"/>' +
    '<path d="M6.5 7.5 L6.5 12 M9.5 7.5 L9.5 12" stroke="' + D + '" stroke-width="1.2"/>'
  ),
  ajustes: () => svg(
    '<circle cx="8" cy="8" r="2.5" stroke="' + C + '" stroke-width="1.4"/>' +
    '<path d="M8 1 L8 3.2 M8 12.8 L8 15 M1 8 L3.2 8 M12.8 8 L15 8' +
    ' M3 3 L4.6 4.6 M11.4 11.4 L13 13 M13 3 L11.4 4.6 M4.6 11.4 L3 13"' +
    ' stroke="' + C + '" stroke-width="1.4"/>' +
    '<circle cx="8" cy="8" r="0.9" fill="' + D + '"/>'
  ),
  ajuda: () => svg(
    '<rect x="2" y="2" width="12" height="12" stroke="' + C + '" stroke-width="1.4"/>' +
    '<path d="M6 6 A2 2 0 1 1 8 9 L8 10" stroke="' + D + '" stroke-width="1.4"/>' +
    '<rect x="7.2" y="11.4" width="1.6" height="1.6" fill="' + D + '"/>'
  ),
  glifos: () => svg(
    '<rect x="2" y="2" width="12" height="12" stroke="' + C + '" stroke-width="1.2"/>' +
    '<path d="M8 4 L11 8 L8 12 L5 8 Z" stroke="' + D + '" stroke-width="1.2"/>' +
    '<rect x="7.3" y="7.3" width="1.4" height="1.4" fill="' + V + '"/>'
  ),
  relatorio: () => svg(
    '<path d="M3 1.5 h7 l3 3 v10 h-10 z" stroke="' + C + '" stroke-width="1.3"/>' +
    '<path d="M10 1.5 v3 h3" stroke="' + C + '" stroke-width="1.3"/>' +
    '<path d="M5 8 h6 M5 10.5 h6" stroke="' + D + '" stroke-width="1.2"/>'
  ),
  baixar: () => svg(
    '<path d="M8 2 L8 10" stroke="' + C + '" stroke-width="1.6"/>' +
    '<path d="M4.5 7 L8 10.5 L11.5 7" stroke="' + D + '" stroke-width="1.6"/>' +
    '<path d="M3 13 h10" stroke="' + C + '" stroke-width="1.6"/>'
  ),
  voltar: () => svg(
    '<path d="M13 8 H4" stroke="' + C + '" stroke-width="1.8"/>' +
    '<path d="M7.5 4 L3.5 8 L7.5 12" stroke="' + D + '" stroke-width="1.8"/>'
  ),
  fechar: () => svg(
    '<path d="M4 4 L12 12 M12 4 L4 12" stroke="' + C + '" stroke-width="1.8"/>'
  ),
  codigo: () => svg(
    '<path d="M6 4 L2.5 8 L6 12" stroke="' + C + '" stroke-width="1.5"/>' +
    '<path d="M10 4 L13.5 8 L10 12" stroke="' + C + '" stroke-width="1.5"/>' +
    '<rect x="7.2" y="7.2" width="1.6" height="1.6" fill="' + V + '"/>'
  ),
  grid: () => svg(
    '<rect x="2" y="2" width="12" height="12" stroke="' + C + '" stroke-width="1.2"/>' +
    '<path d="M6 2 v12 M10 2 v12 M2 6 h12 M2 10 h12" stroke="' + C + '" stroke-width="0.9"/>' +
    '<rect x="6" y="6" width="4" height="4" fill="' + V + '"/>'
  ),
  som: () => svg(
    '<path d="M3 6 h2.5 L9 3 v10 L5.5 10 H3 Z" fill="' + C + '"/>' +
    '<path d="M11 5.5 A3.4 3.4 0 0 1 11 10.5" stroke="' + D + '" stroke-width="1.3"/>'
  ),
  semSom: () => svg(
    '<path d="M3 6 h2.5 L9 3 v10 L5.5 10 H3 Z" fill="' + C + '"/>' +
    '<path d="M11 5.5 L14.5 10.5 M14.5 5.5 L11 10.5" stroke="var(--vermelho)" stroke-width="1.4"/>'
  ),
  lupa: () => svg(
    '<circle cx="7" cy="7" r="4.2" stroke="' + C + '" stroke-width="1.5"/>' +
    '<path d="M10.2 10.2 L14 14" stroke="' + D + '" stroke-width="1.8"/>'
  ),
  repositorio: () => svg(
    '<rect x="2" y="2" width="9" height="9" stroke="' + C + '" stroke-width="1.3"/>' +
    '<path d="M5 5 h3 M5 7.5 h3" stroke="' + D + '" stroke-width="1.1"/>' +
    '<path d="M9 14 L14 14 L14 9" stroke="' + C + '" stroke-width="1.3"/>' +
    '<path d="M14 14 L9.5 9.5" stroke="' + D + '" stroke-width="1.3"/>'
  ),
  nova: () => svg(
    '<circle cx="8" cy="8" r="5.5" stroke="' + C + '" stroke-width="1.2"/>' +
    '<path d="M8 2.5 L8 13.5 M2.5 8 L13.5 8" stroke="' + C + '" stroke-width="0.8"/>' +
    '<circle cx="8" cy="8" r="2" fill="' + D + '"/>'
  ),
  cadete: () => svg(
    '<path d="M8 1.5 L14 4.5 V8 c0 3.6 -2.6 5.6 -6 6.5 C4.6 13.6 2 11.6 2 8 V4.5 Z"' +
    ' stroke="' + C + '" stroke-width="1.3"/>' +
    '<path d="M8 5 L9.2 7.4 L11.8 7.7 L9.9 9.5 L10.4 12 L8 10.8 L5.6 12 L6.1 9.5' +
    ' L4.2 7.7 L6.8 7.4 Z" fill="' + V + '"/>'
  ),
  pasta: () => svg(
    '<path d="M1.5 4 h4.5 l1.5 2 h7 v8 h-13 Z" stroke="' + C + '" stroke-width="1.3"/>' +
    '<path d="M1.5 8 h13" stroke="' + D + '" stroke-width="1"/>'
  ),
  relogio: () => svg(
    '<circle cx="8" cy="8" r="6" stroke="' + C + '" stroke-width="1.4"/>' +
    '<path d="M8 4.5 L8 8 L10.5 9.6" stroke="' + V + '" stroke-width="1.4"/>'
  ),
  lento: () => svg(
    '<circle cx="8" cy="8" r="6" stroke="' + C + '" stroke-width="1.3"/>' +
    '<path d="M6 5.5 L10.5 8 L6 10.5 Z" fill="' + D + '"/>'
  ),
  olho: () => svg(
    '<path d="M1 8 C3.5 4 12.5 4 15 8 C12.5 12 3.5 12 1 8 Z" stroke="' + C + '" stroke-width="1.3"/>' +
    '<circle cx="8" cy="8" r="2" fill="' + D + '"/>'
  ),
  enviar: () => svg(
    '<path d="M2 8 L14 3 L11 14 L8 9.5 Z" stroke="' + C + '" stroke-width="1.3"/>' +
    '<path d="M2 8 L8 9.5" stroke="' + D + '" stroke-width="1.3"/>'
  ),
};

export function icone(nome, tamanho = 16) {
  const fn = ICONES[nome];
  return fn ? fn().replace('width="16" height="16"',
    'width="' + tamanho + '" height="' + tamanho + '"') : '';
}

/* Preenche todos os [data-icone] presentes no documento. */
export function aplicarIcones(raiz = document) {
  raiz.querySelectorAll('[data-icone]').forEach((el) => {
    const nome = el.getAttribute('data-icone');
    const tam = Number(el.getAttribute('data-icone-tam')) || 16;
    const marcacao = icone(nome, tam);
    if (!marcacao) return;
    const alvo = el.querySelector('.slot-icone') || el;
    if (alvo === el) el.insertAdjacentHTML('afterbegin', marcacao);
    else alvo.innerHTML = marcacao;
    el.removeAttribute('data-icone');
  });
}

/* ---------------------------------------------------- alfabeto alienigena */
/*
  24 glifos geometricos desenhados numa grade de 8 por 8. Cada glifo e uma
  lista de segmentos. Servem de moldura decorativa e de item colecionavel.
*/
export const GLIFOS = [
  'M1 1 L7 1 L4 7 Z', 'M1 4 L4 1 L7 4 L4 7 Z', 'M1 1 L7 7 M7 1 L1 7',
  'M4 1 L4 7 M1 4 L7 4', 'M1 1 L7 1 L7 7 M1 4 L4 4',
  'M1 7 L4 1 L7 7 M2.4 4.6 L5.6 4.6', 'M1 4 A3 3 0 0 1 7 4 M1 4 L7 4',
  'M2 1 L2 7 M5 1 L5 7 M2 4 L5 4', 'M1 1 L7 1 M4 1 L4 7 M2 7 L6 7',
  'M1 2 L4 5 L7 2 M4 5 L4 7', 'M1 1 L1 7 L7 7 M1 4 L5 4',
  'M4 1 L1 4 L4 7 L7 4 Z M4 3 L4 5', 'M1 1 L7 4 L1 7 Z',
  'M1 3 L7 3 M1 5 L7 5 M4 1 L4 7', 'M2 1 L6 1 L4 4 L6 7 L2 7',
  'M1 1 L4 4 L1 7 M7 1 L7 7', 'M1 4 L4 1 L7 4 M2.5 6 L5.5 6',
  'M4 1 L4 7 M4 3 L7 1 M4 5 L1 7', 'M1 1 L7 1 L4 4 L7 7 L1 7',
  'M2 2 L6 2 L6 6 L2 6 Z M4 2 L4 6', 'M1 7 L4 1 L7 7 M1 7 L7 7',
  'M1 4 L7 4 M2 2 L2 6 M6 2 L6 6', 'M4 1 L7 5 L1 5 Z M4 5 L4 7',
  'M1 1 L4 4 L7 1 M1 7 L4 4 L7 7',
];

export function glifoSvg(indice, tamanho = 22, cor = 'var(--verde)') {
  const d = GLIFOS[indice % GLIFOS.length];
  return (
    '<svg viewBox="0 0 8 8" width="' + tamanho + '" height="' + tamanho +
    '" fill="none" aria-hidden="true"><path d="' + d + '" stroke="' + cor +
    '" stroke-width="0.7" stroke-linecap="square"/></svg>'
  );
}

/* Friso horizontal repetindo glifos, usado como enfeite de painel. */
export function frisoAlien(quantidade = 18) {
  let partes = '';
  for (let i = 0; i < quantidade; i++) {
    const d = GLIFOS[(i * 7) % GLIFOS.length];
    partes += '<g transform="translate(' + i * 10 + ' 0) scale(1)">' +
      '<path d="' + d + '" stroke="currentColor" stroke-width="0.6" fill="none"/></g>';
  }
  return '<svg viewBox="0 0 ' + quantidade * 10 + ' 8" preserveAspectRatio="none" ' +
    'aria-hidden="true">' + partes + '</svg>';
}
