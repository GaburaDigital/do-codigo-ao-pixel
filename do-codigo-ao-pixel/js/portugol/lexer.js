/* =========================================================================
   lexer.js — Analisador lexico do Portugol.
   Transforma o texto do aluno numa lista de simbolos com linha e coluna,
   para que os erros apontem o lugar certo.
   ========================================================================= */

export const PALAVRAS = new Set([
  'programa', 'funcao', 'se', 'senao', 'enquanto', 'para', 'faca',
  'retorne', 'pare', 'inteiro', 'real', 'logico', 'cadeia', 'caracter',
  'vazio', 'verdadeiro', 'falso', 'e', 'ou', 'nao', 'const',
]);

export const TIPOS = new Set(['inteiro', 'real', 'logico', 'cadeia', 'caracter', 'vazio']);

export class ErroSintaxe extends Error {
  constructor(mensagem, linha, coluna) {
    super('Linha ' + linha + ': ' + mensagem);
    this.nome = 'ErroSintaxe';
    this.linha = linha;
    this.coluna = coluna;
    this.detalhe = mensagem;
  }
}

const SIMBOLOS3 = [];
const SIMBOLOS2 = ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/='];
const SIMBOLOS1 = '+-*/%=<>!(){}[],;.:'.split('');

/* Retira acentos para aceitar tanto "funcao" quanto "função". */
function semAcento(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function analisar(fonte) {
  const simbolos = [];
  let i = 0, linha = 1, coluna = 1;
  const n = fonte.length;

  const avancar = (quantos = 1) => {
    for (let k = 0; k < quantos; k++) {
      if (fonte[i] === '\n') { linha++; coluna = 1; } else { coluna++; }
      i++;
    }
  };
  const juntar = (tipo, valor, l, c) => simbolos.push({ tipo, valor, linha: l, coluna: c });

  while (i < n) {
    const c = fonte[i];

    // espacos
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { avancar(); continue; }

    // comentarios
    if (c === '/' && fonte[i + 1] === '/') {
      while (i < n && fonte[i] !== '\n') avancar();
      continue;
    }
    if (c === '/' && fonte[i + 1] === '*') {
      const l0 = linha;
      avancar(2);
      while (i < n && !(fonte[i] === '*' && fonte[i + 1] === '/')) avancar();
      if (i >= n) throw new ErroSintaxe('comentario aberto com /* e nunca fechado com */', l0, 1);
      avancar(2);
      continue;
    }

    const l0 = linha, c0 = coluna;

    // numeros
    if (/[0-9]/.test(c)) {
      let texto = '';
      while (i < n && /[0-9]/.test(fonte[i])) { texto += fonte[i]; avancar(); }
      if (fonte[i] === '.' && /[0-9]/.test(fonte[i + 1] || '')) {
        texto += '.'; avancar();
        while (i < n && /[0-9]/.test(fonte[i])) { texto += fonte[i]; avancar(); }
        juntar('real', parseFloat(texto), l0, c0);
      } else {
        juntar('inteiro', parseInt(texto, 10), l0, c0);
      }
      continue;
    }

    // identificadores e palavras reservadas
    if (/[A-Za-z_\u00C0-\u017F]/.test(c)) {
      let texto = '';
      while (i < n && /[A-Za-z0-9_\u00C0-\u017F]/.test(fonte[i])) { texto += fonte[i]; avancar(); }
      const puro = semAcento(texto).toLowerCase();
      if (PALAVRAS.has(puro)) juntar('palavra', puro, l0, c0);
      else juntar('nome', texto, l0, c0);
      continue;
    }

    // cadeias
    if (c === '"') {
      let texto = '';
      avancar();
      while (i < n && fonte[i] !== '"') {
        if (fonte[i] === '\n') throw new ErroSintaxe('texto entre aspas nao foi fechado', l0, c0);
        if (fonte[i] === '\\') { avancar(); texto += escapar(fonte[i]); avancar(); continue; }
        texto += fonte[i]; avancar();
      }
      if (i >= n) throw new ErroSintaxe('texto entre aspas nao foi fechado', l0, c0);
      avancar();
      juntar('cadeia', texto, l0, c0);
      continue;
    }

    if (c === "'") {
      avancar();
      let ch = fonte[i];
      if (ch === '\\') { avancar(); ch = escapar(fonte[i]); }
      avancar();
      if (fonte[i] !== "'") throw new ErroSintaxe('caractere deve ter apenas um simbolo entre aspas simples', l0, c0);
      avancar();
      juntar('caracter', ch, l0, c0);
      continue;
    }

    // operadores
    const par3 = fonte.substr(i, 3);
    if (SIMBOLOS3.includes(par3)) { juntar('op', par3, l0, c0); avancar(3); continue; }
    const par2 = fonte.substr(i, 2);
    if (SIMBOLOS2.includes(par2)) { juntar('op', par2, l0, c0); avancar(2); continue; }
    if (SIMBOLOS1.includes(c)) { juntar('op', c, l0, c0); avancar(); continue; }

    throw new ErroSintaxe('simbolo desconhecido: ' + c, l0, c0);
  }

  juntar('fim', null, linha, coluna);
  return simbolos;
}

function escapar(ch) {
  if (ch === 'n') return '\n';
  if (ch === 't') return '\t';
  return ch;
}
