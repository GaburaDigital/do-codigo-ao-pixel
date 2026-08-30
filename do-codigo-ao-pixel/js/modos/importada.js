/* =========================================================================
   importada.js — Modo Desafio com Arte Importada.

   Converte imagens enviadas pelo aluno em artes do formato do projeto:
     1. reduz para a resolucao do treino usando vizinho mais proximo,
        que preserva a aparencia de pixel art
     2. reduz a paleta para no maximo 16 cores, pelo metodo do corte mediano
     3. trata pixels muito transparentes como area vazia
   ========================================================================= */

const MAX_CORES = 16;
const LIMITE_ALFA = 128;

export function lerImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('nao consegui abrir ' + arquivo.name)); };
    img.src = url;
  });
}

/* Vizinho mais proximo: pega a cor do pixel do centro de cada celula. */
function reduzir(img, lado) {
  const fonte = document.createElement('canvas');
  fonte.width = img.naturalWidth || img.width;
  fonte.height = img.naturalHeight || img.height;
  const ctxFonte = fonte.getContext('2d', { willReadFrequently: true });
  ctxFonte.imageSmoothingEnabled = false;
  ctxFonte.drawImage(img, 0, 0);
  const dados = ctxFonte.getImageData(0, 0, fonte.width, fonte.height).data;

  const saida = [];
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const sx = Math.min(fonte.width - 1, Math.floor(((x + 0.5) / lado) * fonte.width));
      const sy = Math.min(fonte.height - 1, Math.floor(((y + 0.5) / lado) * fonte.height));
      const p = (sy * fonte.width + sx) * 4;
      saida.push({ r: dados[p], g: dados[p + 1], b: dados[p + 2], a: dados[p + 3] });
    }
  }
  return saida;
}

/* Corte mediano: divide a nuvem de cores no eixo mais espalhado. */
function corteMediano(pixels, maximo) {
  const visiveis = pixels.filter((p) => p.a >= LIMITE_ALFA);
  if (!visiveis.length) return [];
  let caixas = [visiveis];

  while (caixas.length < maximo) {
    let alvo = -1, maiorFaixa = -1, eixo = 'r';
    caixas.forEach((caixa, i) => {
      if (caixa.length < 2) return;
      for (const canal of ['r', 'g', 'b']) {
        let min = 255, max = 0;
        for (const p of caixa) { if (p[canal] < min) min = p[canal]; if (p[canal] > max) max = p[canal]; }
        const faixa = max - min;
        if (faixa > maiorFaixa) { maiorFaixa = faixa; alvo = i; eixo = canal; }
      }
    });
    if (alvo < 0 || maiorFaixa <= 0) break;
    const caixa = caixas[alvo].slice().sort((a, b) => a[eixo] - b[eixo]);
    const meio = Math.floor(caixa.length / 2);
    caixas.splice(alvo, 1, caixa.slice(0, meio), caixa.slice(meio));
  }

  return caixas.filter((c) => c.length).map((caixa) => {
    let r = 0, g = 0, b = 0;
    for (const p of caixa) { r += p.r; g += p.g; b += p.b; }
    return {
      r: Math.round(r / caixa.length),
      g: Math.round(g / caixa.length),
      b: Math.round(b / caixa.length),
    };
  });
}

function maisProxima(paleta, p) {
  let melhor = 0, menor = Infinity;
  for (let i = 0; i < paleta.length; i++) {
    const c = paleta[i];
    const d = (c.r - p.r) ** 2 + (c.g - p.g) ** 2 + (c.b - p.b) ** 2;
    if (d < menor) { menor = d; melhor = i; }
  }
  return melhor;
}

const hex = (c) =>
  '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

/* Converte uma imagem numa arte pronta para o grid. */
export function converter(img, lado, nome) {
  const pixels = reduzir(img, lado);
  const paleta = corteMediano(pixels, MAX_CORES);
  if (!paleta.length) throw new Error('a imagem "' + nome + '" ficou totalmente vazia depois da conversao');

  const indices = new Uint8Array(pixels.length);
  const usadas = new Set();
  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];
    if (p.a < LIMITE_ALFA) { indices[i] = 0; continue; }
    const idx = maisProxima(paleta, p) + 1;
    indices[i] = idx;
    usadas.add(idx);
  }

  // Reindexa para nao guardar cores que sobraram sem uso.
  const mapa = new Map();
  const paletaFinal = ['transparente'];
  for (const idx of [...usadas].sort((a, b) => a - b)) {
    mapa.set(idx, paletaFinal.length);
    paletaFinal.push(hex(paleta[idx - 1]));
  }

  let pintados = 0;
  const partes = [];
  let atual = null, cont = 0;
  for (let i = 0; i < indices.length; i++) {
    const v = indices[i] === 0 ? 0 : mapa.get(indices[i]);
    if (v !== 0) pintados++;
    if (v === atual) cont++;
    else {
      if (atual !== null) partes.push(atual + 'x' + cont);
      atual = v; cont = 1;
    }
  }
  partes.push(atual + 'x' + cont);

  if (!pintados) throw new Error('a imagem "' + nome + '" ficou sem nenhum pixel visivel');

  return {
    id: 'importada',
    nome: nome.replace(/\.[^.]+$/, '').slice(0, 40),
    categoria: 'importada',
    largura: lado,
    altura: lado,
    par: Math.max(12, Math.round(Math.sqrt(pintados) * 2)),
    dica: 'Arte enviada por voce. Observe se ha padroes que dao para repetir.',
    paleta: paletaFinal,
    pintados,
    pixels: partes.join(','),
  };
}

/* Miniatura para a tela de configuracao. */
export function miniatura(arte, tamanho = 48) {
  const cv = document.createElement('canvas');
  cv.width = arte.largura;
  cv.height = arte.altura;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(arte.largura, arte.altura);
  const paleta = arte.paleta.map((c) =>
    c === 'transparente' ? null : [
      parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16),
    ]);
  let p = 0;
  for (const trecho of arte.pixels.split(',')) {
    const corte = trecho.indexOf('x');
    const idx = Number(trecho.slice(0, corte));
    const vezes = Number(trecho.slice(corte + 1));
    for (let k = 0; k < vezes; k++, p++) {
      const cor = paleta[idx];
      const q = p * 4;
      if (!cor) { img.data[q + 3] = 0; continue; }
      img.data[q] = cor[0]; img.data[q + 1] = cor[1]; img.data[q + 2] = cor[2]; img.data[q + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const alvo = document.createElement('canvas');
  alvo.width = tamanho;
  alvo.height = tamanho;
  const ctx2 = alvo.getContext('2d');
  ctx2.imageSmoothingEnabled = false;
  ctx2.drawImage(cv, 0, 0, tamanho, tamanho);
  return alvo.toDataURL('image/png');
}
