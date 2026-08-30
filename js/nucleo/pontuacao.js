/* =========================================================================
   pontuacao.js — Formula de pontos, patentes, insignias e glifos.

   pontos = base x completude x tempo x eficiencia - penalidade por erro
   ========================================================================= */

export const BASE_POR_TAMANHO = { 32: 100, 64: 250, 128: 500 };

/* Tempo de referencia (em segundos) para ganhar o multiplicador cheio. */
export const REFERENCIA_SEGUNDOS = { 32: 90, 64: 150, 128: 240 };

export const PENALIDADE_ERRO = 5;

export function multiplicadorTempo(segundos, tamanho) {
  const ref = REFERENCIA_SEGUNDOS[tamanho] || 120;
  if (segundos <= ref * 0.5) return 1.5;
  if (segundos >= ref * 2) return 0.8;
  const t = (segundos - ref * 0.5) / (ref * 1.5);
  return Number((1.5 - t * 0.7).toFixed(3));
}

export function multiplicadorEficiencia(tamanhoCodigo, par) {
  if (!par) return 1;
  if (tamanhoCodigo <= par) return 1.5;
  if (tamanhoCodigo <= par * 2) return 1.0;
  return 0.6;
}

/* 0 a 100. Quanto menor o codigo em relacao ao par, maior a taxa. */
export function eficienciaTransmissao(tamanhoCodigo, par) {
  if (!par || !tamanhoCodigo) return 0;
  const taxa = Math.min(1.6, par / tamanhoCodigo);
  return Math.round(Math.min(100, (taxa / 1.6) * 100));
}

export function calcularPontos({ tamanho, percentual, completa, segundos, tamanhoCodigo, par, erros }) {
  const base = BASE_POR_TAMANHO[tamanho] || 100;
  const completude = completa ? 2.0 : 1.0;
  const mTempo = multiplicadorTempo(segundos, tamanho);
  const mEfic = multiplicadorEficiencia(tamanhoCodigo, par);
  const bruto = base * completude * mTempo * mEfic;
  const desconto = (erros || 0) * PENALIDADE_ERRO;
  return {
    total: Math.max(0, Math.round(bruto - desconto)),
    base,
    completude,
    mTempo,
    mEfic,
    desconto,
    percentual,
    eficiencia: eficienciaTransmissao(tamanhoCodigo, par),
  };
}

/* ------------------------------------------------------------- patentes */

export const PATENTES = [
  { nome: 'Recruta', minimo: 0 },
  { nome: 'Cadete', minimo: 400 },
  { nome: 'Piloto', minimo: 1200 },
  { nome: 'Navegador', minimo: 3000 },
  { nome: 'Comandante', minimo: 6000 },
  { nome: 'Almirante Estelar', minimo: 12000 },
];

export function patenteDe(pontos) {
  let atual = PATENTES[0];
  for (const p of PATENTES) if (pontos >= p.minimo) atual = p;
  return atual;
}

export function proximaPatente(pontos) {
  return PATENTES.find((p) => p.minimo > pontos) || null;
}

/* ------------------------------------------------------------ insignias */

export const INSIGNIAS = [
  { id: 'cirurgiao', nome: 'Cirurgiao', desc: 'Completou uma arte sem nenhum pixel errado.' },
  { id: 'sub-30', nome: 'Sub-30', desc: 'Completou uma arte em menos de 30 segundos.' },
  { id: 'mestre-laco', nome: 'Mestre do Laco', desc: 'Completou usando pelo menos uma repeticao e nenhum pintar solto fora dela.' },
  { id: 'compressor', nome: 'Compressor', desc: 'Terminou com eficiencia de transmissao acima de 90%.' },
  { id: 'maratona', nome: 'Maratona', desc: 'Completou 5 artes em um unico treino.' },
  { id: 'poliglota', nome: 'Poliglota', desc: 'Completou artes nas duas linguagens de programacao.' },
];

export function avaliarInsignias(ctx) {
  const ganhas = [];
  if (ctx.completa && ctx.erros === 0) ganhas.push('cirurgiao');
  if (ctx.completa && ctx.segundos < 30) ganhas.push('sub-30');
  if (ctx.completa && ctx.usouRepeticao && !ctx.pintarSolto) ganhas.push('mestre-laco');
  if (ctx.completa && ctx.eficiencia >= 90) ganhas.push('compressor');
  if (ctx.artesFeitas >= 5) ganhas.push('maratona');
  return ganhas;
}

/* --------------------------------------------------------------- glifos */
/*
  O alfabeto alienigena tem 24 glifos. Cada arte concluida a 100% decodifica
  um glifo novo, escolhido entre os que ainda faltam.
*/
export const TOTAL_GLIFOS = 24;

export const SIGNIFICADOS = [
  'ORIGEM', 'ROTA', 'LUZ', 'SOMBRA', 'CICLO', 'PORTA', 'NUCLEO', 'ECO',
  'SEMENTE', 'ORDEM', 'RUIDO', 'PONTE', 'VAZIO', 'PULSO', 'ESPIRAL', 'GUARDA',
  'MEMORIA', 'DERIVA', 'CHAMA', 'SILENCIO', 'ENXAME', 'LIMIAR', 'MARE', 'FIM',
];

export function sortearGlifoNovo(jaTenho) {
  const faltam = [];
  for (let i = 0; i < TOTAL_GLIFOS; i++) if (!jaTenho.includes(i)) faltam.push(i);
  if (!faltam.length) return null;
  return faltam[Math.floor(Math.random() * faltam.length)];
}
