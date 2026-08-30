/*
  gerar-icones.mjs — Gera os PNG do PWA a partir da mesma definicao do favicon.

  Uso: node ferramentas/gerar-icones.mjs

  Produz em assets/icones/:
    icone-192.png, icone-512.png (instalacao no Android e desktop)
    icone-maskable-512.png       (icone adaptativo com area de seguranca)
    apple-touch-icon.png         (180x180, exigido pelo Safari no iOS)

  Nao depende de nenhuma biblioteca externa: o PNG e montado na mao com zlib.
*/

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAIDA = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'icones');

const FUNDO = [0x08, 0x0b, 0x08];
const BORDA = [0xc9, 0xcf, 0xc9];
const LUZ = [0xf0, 0xf2, 0xf0];
const SOMBRA = [0x6e, 0x76, 0x6e];
const VERDE = [0x3b, 0xff, 0x9e];

/* Desenha o icone numa matriz 32x32 de cores. */
function base32() {
  const g = Array.from({ length: 32 }, () => Array(32).fill(FUNDO));
  const pinta = (x, y, c) => { if (x >= 0 && y >= 0 && x < 32 && y < 32) g[y][x] = c; };
  const ret = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pinta(x + i, y + j, c); };

  for (let y = 1; y <= 30; y++)
    for (let x = 1; x <= 30; x++)
      if (x <= 2 || x >= 29 || y <= 2 || y >= 29) pinta(x, y, BORDA);

  for (let i = 3; i <= 28; i++) { pinta(i, 3, LUZ); pinta(3, i, LUZ); }
  for (let i = 3; i <= 28; i++) { pinta(i, 28, SOMBRA); pinta(28, i, SOMBRA); }

  ret(6, 21, 5, 5, BORDA);
  ret(11, 21, 5, 5, BORDA);
  ret(11, 16, 5, 5, BORDA);
  ret(16, 16, 5, 5, BORDA);
  ret(16, 11, 5, 5, BORDA);
  ret(21, 11, 5, 5, BORDA);

  for (let i = 0; i < 5; i++) {
    pinta(21 + i, 6, VERDE); pinta(21 + i, 10, VERDE);
    pinta(21, 6 + i, VERDE); pinta(25, 6 + i, VERDE);
  }
  return g;
}

function crc32(buf) {
  let c, tabela = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = tabela[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pedaco(tipo, dados) {
  const t = Buffer.from(tipo, 'ascii');
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([tam, t, dados, crc]);
}

function png(largura, altura, pixels) {
  const linhas = [];
  for (let y = 0; y < altura; y++) {
    linhas.push(Buffer.from([0]));
    const l = Buffer.alloc(largura * 4);
    for (let x = 0; x < largura; x++) {
      const c = pixels[y][x];
      l[x * 4] = c[0]; l[x * 4 + 1] = c[1]; l[x * 4 + 2] = c[2]; l[x * 4 + 3] = 255;
    }
    linhas.push(l);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0); ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(Buffer.concat(linhas), { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}

/* Amplia por vizinho mais proximo e centraliza numa tela do tamanho pedido. */
function montar(tela, conteudo) {
  const g = base32();
  const fator = Math.floor(conteudo / 32);
  const desenho = conteudo === 32 * fator ? fator : fator;
  const lado = 32 * desenho;
  const off = Math.floor((tela - lado) / 2);
  const saida = Array.from({ length: tela }, () => Array(tela).fill(FUNDO));
  for (let y = 0; y < lado; y++)
    for (let x = 0; x < lado; x++)
      saida[y + off][x + off] = g[Math.floor(y / desenho)][Math.floor(x / desenho)];
  return saida;
}

const arquivos = [
  ['icone-192.png', 192, 192],
  ['icone-512.png', 512, 512],
  ['icone-maskable-512.png', 512, 384],
  ['apple-touch-icon.png', 180, 160],
];

for (const [nome, tela, conteudo] of arquivos) {
  writeFileSync(join(SAIDA, nome), png(tela, tela, montar(tela, conteudo)));
  console.log('gerado: assets/icones/' + nome);
}
