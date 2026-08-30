/* =========================================================================
   relatorio.js — Monta o "cartao de missao" com o resultado do treino e
   exporta como PNG. O nome do aluno e digitado na hora de exportar.
   ========================================================================= */

import { GLIFOS } from './icones.js';
import { patenteDe, INSIGNIAS } from '../nucleo/pontuacao.js';

const L = 1000;   // largura do cartao
const A = 700;    // altura do cartao

const FUNDO = '#050705';
const LINHA = '#435145';
const TEXTO = '#E6EDE7';
const SUAVE = '#93A195';
const VERDE = '#3BFF9E';
const CIANO = '#4DE1FF';

function fonte(ctx, tamanho, peso = 'normal') {
  ctx.font = peso + ' ' + tamanho + 'px ui-monospace, Menlo, Consolas, monospace';
}

function glifo(ctx, indice, x, y, tam, cor) {
  const d = GLIFOS[indice % GLIFOS.length];
  const caminho = new Path2D(d);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(tam / 8, tam / 8);
  ctx.strokeStyle = cor;
  ctx.lineWidth = 0.7;
  ctx.stroke(caminho);
  ctx.restore();
}

export function desenharCartao(dados) {
  const cv = document.createElement('canvas');
  cv.width = L;
  cv.height = A;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, L, A);

  // moldura dupla
  ctx.strokeStyle = LINHA;
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, L - 36, A - 36);
  ctx.strokeStyle = VERDE;
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, L - 52, A - 52);

  // friso de glifos no topo
  for (let i = 0; i < 26; i++) {
    glifo(ctx, i * 5 + 1, 40 + i * 35, 40, 16, 'rgba(59,255,158,0.45)');
  }

  fonte(ctx, 15);
  ctx.fillStyle = SUAVE;
  ctx.fillText('NAVE-ESCOLA ORION-9  //  RELATORIO DE TREINAMENTO', 44, 96);

  fonte(ctx, 34, 'bold');
  ctx.fillStyle = TEXTO;
  ctx.fillText('DO CODIGO AO PIXEL', 44, 138);

  ctx.strokeStyle = LINHA;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(44, 158); ctx.lineTo(L - 44, 158); ctx.stroke();

  // identificacao
  fonte(ctx, 13);
  ctx.fillStyle = SUAVE;
  ctx.fillText('CADETE', 44, 186);
  fonte(ctx, 28);
  ctx.fillStyle = CIANO;
  ctx.fillText((dados.aluno || 'SEM IDENTIFICACAO').toUpperCase().slice(0, 30), 44, 220);

  fonte(ctx, 13);
  ctx.fillStyle = SUAVE;
  ctx.fillText('PATENTE', 500, 186);
  fonte(ctx, 28);
  ctx.fillStyle = VERDE;
  ctx.fillText(patenteDe(dados.pontosTotais || dados.pontos).nome.toUpperCase(), 500, 220);

  // caixas de numeros
  const caixas = [
    ['PONTUACAO', String(dados.pontos)],
    ['ARTES 100%', String(dados.artesFeitas)],
    ['ARTES PASSADAS', String(dados.artesPassadas)],
    ['EFICIENCIA MEDIA', dados.eficienciaMedia + '%'],
  ];
  const larguraCaixa = (L - 88 - 3 * 14) / 4;
  caixas.forEach(([rotulo, valor], i) => {
    const x = 44 + i * (larguraCaixa + 14);
    ctx.strokeStyle = LINHA;
    ctx.strokeRect(x, 248, larguraCaixa, 92);
    fonte(ctx, 12);
    ctx.fillStyle = SUAVE;
    ctx.fillText(rotulo, x + 14, 272);
    fonte(ctx, 38, 'bold');
    ctx.fillStyle = VERDE;
    ctx.fillText(valor, x + 14, 322);
  });

  // configuracao do treino
  fonte(ctx, 13);
  ctx.fillStyle = SUAVE;
  const linhaConfig =
    'MODO ' + dados.modo.toUpperCase() +
    '   |   RESOLUCAO ' + dados.tamanho + 'x' + dados.tamanho +
    '   |   FOCO ' + dados.foco.toUpperCase() +
    '   |   DURACAO ' + dados.duracao;
  ctx.fillText(linhaConfig, 44, 368);

  // historico
  fonte(ctx, 13);
  ctx.fillStyle = SUAVE;
  ctx.fillText('REGISTRO DE TRANSMISSOES', 44, 402);
  ctx.strokeStyle = LINHA;
  ctx.beginPath(); ctx.moveTo(44, 412); ctx.lineTo(L - 44, 412); ctx.stroke();

  const colunas = [44, 420, 560, 690, 830];
  fonte(ctx, 12);
  ctx.fillStyle = SUAVE;
  ['ARTE', 'CONCLUSAO', 'TEMPO', 'BLOCOS/PAR', 'PONTOS'].forEach((t, i) => {
    ctx.fillText(t, colunas[i], 432);
  });

  const linhas = (dados.historico || []).slice(-8);
  linhas.forEach((h, i) => {
    const y = 456 + i * 24;
    fonte(ctx, 13);
    ctx.fillStyle = TEXTO;
    ctx.fillText(String(h.nome).slice(0, 34), colunas[0], y);
    ctx.fillStyle = h.percentual >= 100 ? VERDE : SUAVE;
    ctx.fillText(Math.round(h.percentual) + '%', colunas[1], y);
    ctx.fillStyle = SUAVE;
    ctx.fillText(h.segundos + 's', colunas[2], y);
    ctx.fillText(h.blocos + ' / ' + h.par, colunas[3], y);
    ctx.fillStyle = TEXTO;
    ctx.fillText(String(h.pontos), colunas[4], y);
  });

  if (!linhas.length) {
    fonte(ctx, 13);
    ctx.fillStyle = SUAVE;
    ctx.fillText('Nenhuma arte concluida neste treino.', 44, 456);
  }

  // insignias
  const yIns = A - 118;
  fonte(ctx, 13);
  ctx.fillStyle = SUAVE;
  ctx.fillText('INSIGNIAS DESTE TREINO', 44, yIns);
  const nomes = (dados.insignias || [])
    .map((id) => (INSIGNIAS.find((x) => x.id === id) || {}).nome)
    .filter(Boolean);
  fonte(ctx, 15);
  ctx.fillStyle = nomes.length ? CIANO : SUAVE;
  ctx.fillText(nomes.length ? nomes.join('   ·   ') : 'nenhuma desta vez', 44, yIns + 26);

  // glifos decodificados
  if ((dados.glifos || []).length) {
    fonte(ctx, 13);
    ctx.fillStyle = SUAVE;
    ctx.fillText('GLIFOS DECODIFICADOS', 620, yIns);
    dados.glifos.slice(0, 8).forEach((g, i) => {
      glifo(ctx, g, 620 + i * 32, yIns + 10, 22, VERDE);
    });
  }

  // rodape
  ctx.strokeStyle = LINHA;
  ctx.beginPath(); ctx.moveTo(44, A - 62); ctx.lineTo(L - 44, A - 62); ctx.stroke();
  fonte(ctx, 12);
  ctx.fillStyle = SUAVE;
  ctx.fillText('criado por GABURA  ·  sites.google.com/view/links-gabura', 44, A - 40);
  ctx.fillText(dados.data, L - 44 - ctx.measureText(dados.data).width, A - 40);

  return cv;
}

export function baixarCartao(dados) {
  const cv = desenharCartao(dados);
  const link = document.createElement('a');
  const nomeArquivo =
    'relatorio-' +
    (dados.aluno || 'cadete').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' + dados.data.replace(/[^0-9]/g, '') + '.png';
  link.download = nomeArquivo;
  link.href = cv.toDataURL('image/png');
  link.click();
}
