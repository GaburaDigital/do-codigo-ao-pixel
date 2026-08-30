/* =========================================================================
   interpretador.js — Executa a arvore do Portugol usando a mesma biblioteca
   pixel dos blocos, para que as duas linguagens se comportem igual.
   ========================================================================= */

import { analisarPrograma, contarInstrucoes } from './parser.js';
import { ErroSintaxe } from './lexer.js';
import { ErroExecucao } from '../exec/api-pixel.js';

const PADRAO_TIPO = {
  inteiro: 0, real: 0, logico: false, cadeia: '', caracter: ' ', vazio: null,
};

class Escopo {
  constructor(pai = null) { this.pai = pai; this.vars = new Map(); }
  declarar(nome, valor) { this.vars.set(nome, { valor }); }
  achar(nome) {
    let e = this;
    while (e) { if (e.vars.has(nome)) return e.vars.get(nome); e = e.pai; }
    return null;
  }
}

const SINAL_RETORNO = Symbol('retorne');
const SINAL_PARE = Symbol('pare');

/* --------------------------------------------------- biblioteca pixel */

function biblioteca(P) {
  const inteiro = (v) => Math.trunc(Number(v) || 0);
  return {
    mover_x: (d) => { P.moverX(inteiro(d)); },
    mover_y: (d) => { P.moverY(inteiro(d)); },
    ir_para: (x, y) => { P.irPara(inteiro(x), inteiro(y)); },
    ir_para_x: (x) => { P.irParaX(inteiro(x)); },
    ir_para_y: (y) => { P.irParaY(inteiro(y)); },
    posicao_x: () => P.posicaoX(),
    posicao_y: () => P.posicaoY(),
    largura: () => P.largura(),
    altura: () => P.altura(),
    apagar: () => { P.apagar(); },
    cor: (r, g, b) => ((inteiro(r) & 255) << 16) | ((inteiro(g) & 255) << 8) | (inteiro(b) & 255),
    pintar: (a, b, c) => {
      if (b === undefined) {
        const v = inteiro(a);
        if (v < 0) throw new ErroExecucao('COR INVALIDA em pixel.pintar. Use pixel.cor(r, g, b).', 'valor');
        P.pintar([(v >> 16) & 255, (v >> 8) & 255, v & 255]);
      } else {
        P.pintar([inteiro(a), inteiro(b), inteiro(c)]);
      }
    },
    cor_em: (x, y) => {
      const c = P.pegarCor(x === undefined ? undefined : inteiro(x), y === undefined ? undefined : inteiro(y));
      if (c[0] === -1) return -1;
      return (c[0] << 16) | (c[1] << 8) | c[2];
    },
    vermelho: (c) => (inteiro(c) < 0 ? -1 : (inteiro(c) >> 16) & 255),
    verde: (c) => (inteiro(c) < 0 ? -1 : (inteiro(c) >> 8) & 255),
    azul: (c) => (inteiro(c) < 0 ? -1 : inteiro(c) & 255),
    vazio: (c) => inteiro(c) < 0,
    esta_vazio: (c) => inteiro(c) < 0,
    iguais: (a, b) => inteiro(a) === inteiro(b),
  };
}

const MATEMATICA = {
  abs: Math.abs,
  raiz: Math.sqrt,
  potencia: Math.pow,
  arredondar: Math.round,
  piso: Math.floor,
  teto: Math.ceil,
  maximo: Math.max,
  minimo: Math.min,
};

/* -------------------------------------------------------- execucao */

export function interpretar(fonte, P) {
  let arvore;
  try {
    arvore = analisarPrograma(fonte);
  } catch (e) {
    if (e instanceof ErroSintaxe) {
      return { ok: false, erro: 'ERRO DE SINTAXE — ' + e.message, tipo: 'sintaxe', linha: e.linha };
    }
    throw e;
  }

  const instrucoes = contarInstrucoes(arvore);
  const pixel = biblioteca(P);
  const funcoes = new Map();
  for (const f of arvore.funcoes) {
    if (funcoes.has(f.nome)) {
      return { ok: false, erro: 'ERRO — a funcao "' + f.nome + '" foi declarada duas vezes.', tipo: 'sintaxe', linha: f.linha };
    }
    funcoes.set(f.nome, f);
  }

  const global = new Escopo();
  let profundidade = 0;

  function erroExec(mensagem, linha) {
    return new ErroExecucao('Linha ' + linha + ': ' + mensagem, 'execucao');
  }

  /* --------------------------------------------------- avaliacao */

  function valorPadrao(tipo) {
    return Object.prototype.hasOwnProperty.call(PADRAO_TIPO, tipo) ? PADRAO_TIPO[tipo] : 0;
  }

  function criarVetor(dimensoes, tipo, escopo, indice = 0) {
    const tamanho = Math.max(0, Math.trunc(avaliar(dimensoes[indice], escopo)));
    const saida = new Array(tamanho);
    for (let i = 0; i < tamanho; i++) {
      saida[i] = indice + 1 < dimensoes.length
        ? criarVetor(dimensoes, tipo, escopo, indice + 1)
        : valorPadrao(tipo);
    }
    return saida;
  }

  function achar(nome, linha, escopo) {
    const celula = escopo.achar(nome);
    if (!celula) throw erroExec('a variavel "' + nome + '" nao foi declarada.', linha);
    return celula;
  }

  function referencia(no, escopo) {
    if (no.tipo === 'Variavel') return achar(no.nome, no.linha, escopo);
    if (no.tipo === 'Indice') {
      const base = referencia(no.base, escopo);
      const idx = Math.trunc(avaliar(no.indice, escopo));
      if (!Array.isArray(base.valor)) throw erroExec('esta variavel nao e um vetor.', no.linha);
      if (idx < 0 || idx >= base.valor.length) {
        throw erroExec('indice ' + idx + ' fora do vetor, que vai de 0 a ' + (base.valor.length - 1) + '.', no.linha);
      }
      return {
        get valor() { return base.valor[idx]; },
        set valor(v) { base.valor[idx] = v; },
      };
    }
    throw erroExec('nao da para atribuir valor a esta expressao.', no.linha);
  }

  function avaliar(no, escopo) {
    switch (no.tipo) {
      case 'Numero': case 'Texto': case 'Caractere': case 'Logico':
        return no.valor;

      case 'Variavel':
        return achar(no.nome, no.linha, escopo).valor;

      case 'Indice':
        return referencia(no, escopo).valor;

      case 'Membro':
        throw erroExec('use "' + no.membro + '" como comando, por exemplo pixel.' + no.membro + '(...)', no.linha);

      case 'Unario': {
        const v = avaliar(no.valor, escopo);
        if (no.op === '-') return -v;
        return !v;
      }

      case 'Binario': {
        const op = no.op;
        if (op === 'e' || op === '&&') return !!avaliar(no.esquerda, escopo) && !!avaliar(no.direita, escopo);
        if (op === 'ou' || op === '||') return !!avaliar(no.esquerda, escopo) || !!avaliar(no.direita, escopo);
        const a = avaliar(no.esquerda, escopo);
        const b = avaliar(no.direita, escopo);
        switch (op) {
          case '+': return (typeof a === 'string' || typeof b === 'string') ? String(a) + String(b) : a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/':
            if (b === 0) throw erroExec('divisao por zero.', no.linha);
            return (Number.isInteger(a) && Number.isInteger(b)) ? Math.trunc(a / b) : a / b;
          case '%':
            if (b === 0) throw erroExec('resto de divisao por zero.', no.linha);
            return a % b;
          case '==': return a === b;
          case '!=': return a !== b;
          case '<': return a < b;
          case '>': return a > b;
          case '<=': return a <= b;
          case '>=': return a >= b;
        }
        throw erroExec('operador desconhecido: ' + op, no.linha);
      }

      case 'Chamada':
        return chamar(no, escopo);

      case 'PassoPrefixo': {
        const ref = referencia(no.alvo, escopo);
        ref.valor = ref.valor + (no.op === '++' ? 1 : -1);
        return ref.valor;
      }

      default:
        throw erroExec('nao sei avaliar "' + no.tipo + '".', no.linha);
    }
  }

  function chamar(no, escopo) {
    const alvo = no.alvo;
    const args = no.args.map((a) => avaliar(a, escopo));

    // Chamadas de biblioteca: pixel.algo(...) ou matematica.algo(...)
    if (alvo.tipo === 'Membro') {
      const base = alvo.base;
      if (base.tipo !== 'Variavel') throw erroExec('chamada de biblioteca invalida.', no.linha);
      const nomeBiblioteca = base.nome.toLowerCase();
      if (nomeBiblioteca === 'pixel') {
        const fn = pixel[alvo.membro];
        if (!fn) {
          throw erroExec('a biblioteca pixel nao tem o comando "' + alvo.membro +
            '". Veja a documentacao no botao de ajuda do editor.', no.linha);
        }
        return fn(...args);
      }
      if (nomeBiblioteca === 'matematica' || nomeBiblioteca === 'math') {
        const fn = MATEMATICA[alvo.membro];
        if (!fn) throw erroExec('a biblioteca matematica nao tem "' + alvo.membro + '".', no.linha);
        return fn(...args);
      }
      throw erroExec('biblioteca desconhecida: "' + base.nome + '". Disponiveis: pixel, matematica.', no.linha);
    }

    if (alvo.tipo !== 'Variavel') throw erroExec('chamada de funcao invalida.', no.linha);
    const f = funcoes.get(alvo.nome);
    if (!f) {
      throw erroExec('a funcao "' + alvo.nome + '" nao existe. Se e da biblioteca, escreva pixel.' + alvo.nome + '(...)', no.linha);
    }
    if (args.length !== f.params.length) {
      throw erroExec('a funcao "' + f.nome + '" espera ' + f.params.length +
        ' parametro(s) e recebeu ' + args.length + '.', no.linha);
    }
    return executarFuncao(f, args);
  }

  function executarFuncao(f, args) {
    if (++profundidade > 120) {
      profundidade--;
      throw new ErroExecucao('CHAMADAS DEMAIS. Alguma funcao esta chamando a si mesma sem parar.', 'limite');
    }
    const escopo = new Escopo(global);
    f.params.forEach((par, i) => escopo.declarar(par.nome, args[i]));
    try {
      const r = executar(f.corpo, escopo);
      if (r && r.sinal === SINAL_RETORNO) return r.valor;
      return null;
    } finally {
      profundidade--;
    }
  }

  /* --------------------------------------------------- comandos */

  function executar(no, escopo) {
    P.passo();
    switch (no.tipo) {
      case 'Bloco': {
        const dentro = new Escopo(escopo);
        for (const item of no.itens) {
          const r = executar(item, dentro);
          if (r) return r;
        }
        return null;
      }

      case 'Declaracao': {
        for (const d of no.nomes) {
          let valor;
          if (d.dimensoes.length) {
            valor = criarVetor(d.dimensoes, no.tipoDado, escopo);
            if (d.inicial && d.inicial.tipo === 'Lista') valor = materializar(d.inicial, escopo);
          } else if (d.inicial) {
            valor = d.inicial.tipo === 'Lista' ? materializar(d.inicial, escopo) : avaliar(d.inicial, escopo);
          } else {
            valor = valorPadrao(no.tipoDado);
          }
          if (no.tipoDado === 'inteiro' && typeof valor === 'number') valor = Math.trunc(valor);
          escopo.declarar(d.nome, valor);
        }
        return null;
      }

      case 'Atribuicao': {
        const ref = referencia(no.alvo, escopo);
        const v = avaliar(no.valor, escopo);
        if (no.op === '=') ref.valor = v;
        else if (no.op === '+=') ref.valor = ref.valor + v;
        else if (no.op === '-=') ref.valor = ref.valor - v;
        else if (no.op === '*=') ref.valor = ref.valor * v;
        else if (no.op === '/=') {
          if (v === 0) throw erroExec('divisao por zero.', no.linha);
          ref.valor = Math.trunc(ref.valor / v);
        }
        return null;
      }

      case 'Passo': {
        const ref = referencia(no.alvo, escopo);
        ref.valor = ref.valor + (no.op === '++' ? 1 : -1);
        return null;
      }

      case 'ComandoExpressao':
        avaliar(no.expressao, escopo);
        return null;

      case 'Se':
        if (avaliar(no.condicao, escopo)) return executar(no.entao, escopo);
        if (no.senao) return executar(no.senao, escopo);
        return null;

      case 'Enquanto':
        while (avaliar(no.condicao, escopo)) {
          P.passo();
          const r = executar(no.corpo, escopo);
          if (r) { if (r.sinal === SINAL_PARE) break; return r; }
        }
        return null;

      case 'FacaEnquanto':
        do {
          P.passo();
          const r = executar(no.corpo, escopo);
          if (r) { if (r.sinal === SINAL_PARE) break; return r; }
        } while (avaliar(no.condicao, escopo));
        return null;

      case 'Para': {
        const dentro = new Escopo(escopo);
        if (no.inicio) executar(no.inicio, dentro);
        while (no.condicao === null || avaliar(no.condicao, dentro)) {
          P.passo();
          const r = executar(no.corpo, dentro);
          if (r) { if (r.sinal === SINAL_PARE) break; return r; }
          if (no.incremento) executar(no.incremento, dentro);
        }
        return null;
      }

      case 'Retorne':
        return { sinal: SINAL_RETORNO, valor: no.valor ? avaliar(no.valor, escopo) : null };

      case 'Pare':
        return { sinal: SINAL_PARE };

      default:
        throw erroExec('comando desconhecido: ' + no.tipo, no.linha);
    }
  }

  function materializar(lista, escopo) {
    return lista.itens.map((i) => (i.tipo === 'Lista' ? materializar(i, escopo) : avaliar(i, escopo)));
  }

  /* --------------------------------------------------- disparo */

  try {
    for (const g of arvore.globais) executar(g, global);
    executarFuncao(funcoes.get('inicio'), []);
  } catch (e) {
    if (e instanceof ErroExecucao) return { ok: false, erro: e.message, tipo: e.tipo, instrucoes };
    return { ok: false, erro: 'ERRO INESPERADO: ' + (e && e.message ? e.message : e), tipo: 'execucao', instrucoes };
  }

  return { ok: true, instrucoes };
}

export { contarInstrucoes };
