/* =========================================================================
   parser.js — Analisador sintatico do Portugol.
   Constroi a arvore do programa. Qualquer erro de escrita e reportado aqui,
   antes de qualquer coisa ser desenhada no grid.
   ========================================================================= */

import { analisar, ErroSintaxe, TIPOS } from './lexer.js';

const PRECEDENCIA = {
  'ou': 1, '||': 1,
  'e': 2, '&&': 2,
  '==': 3, '!=': 3,
  '<': 4, '>': 4, '<=': 4, '>=': 4,
  '+': 5, '-': 5,
  '*': 6, '/': 6, '%': 6,
};

export function analisarPrograma(fonte) {
  const simbolos = analisar(fonte);
  let p = 0;

  const atual = () => simbolos[p];
  const olhar = (k = 0) => simbolos[p + k] || simbolos[simbolos.length - 1];
  const ehOp = (v) => atual().tipo === 'op' && atual().valor === v;
  const ehPalavra = (v) => atual().tipo === 'palavra' && atual().valor === v;
  const avancar = () => simbolos[p++];

  function erro(mensagem) {
    const s = atual();
    return new ErroSintaxe(mensagem, s.linha, s.coluna);
  }

  function exigirOp(v, contexto) {
    if (!ehOp(v)) throw erro('esperava "' + v + '"' + (contexto ? ' ' + contexto : '') + ', encontrei "' + descrever(atual()) + '"');
    return avancar();
  }
  function exigirPalavra(v) {
    if (!ehPalavra(v)) throw erro('esperava "' + v + '", encontrei "' + descrever(atual()) + '"');
    return avancar();
  }
  function exigirNome(contexto) {
    if (atual().tipo !== 'nome') throw erro('esperava um nome ' + contexto + ', encontrei "' + descrever(atual()) + '"');
    return avancar().valor;
  }

  /* ------------------------------------------------------ programa */

  function programa() {
    exigirPalavra('programa');
    exigirOp('{', 'depois de programa');
    const funcoes = [];
    const globais = [];
    while (!ehOp('}')) {
      if (atual().tipo === 'fim') throw erro('o bloco "programa" nao foi fechado com }');
      if (ehPalavra('funcao')) funcoes.push(funcao());
      else if (atual().tipo === 'palavra' && TIPOS.has(atual().valor)) globais.push(declaracao());
      else throw erro('dentro de "programa" so cabem funcoes e variaveis, encontrei "' + descrever(atual()) + '"');
    }
    exigirOp('}');
    if (atual().tipo !== 'fim') throw erro('encontrei conteudo depois do fim do programa');
    if (!funcoes.some((f) => f.nome === 'inicio')) {
      throw new ErroSintaxe('todo programa precisa da funcao "inicio". Escreva: funcao inicio() { }', 1, 1);
    }
    return { tipo: 'Programa', funcoes, globais };
  }

  function funcao() {
    exigirPalavra('funcao');
    let retorno = 'vazio';
    if (atual().tipo === 'palavra' && TIPOS.has(atual().valor)) retorno = avancar().valor;
    const linha = atual().linha;
    const nome = exigirNome('para a funcao');
    exigirOp('(', 'depois do nome da funcao');
    const params = [];
    while (!ehOp(')')) {
      if (atual().tipo !== 'palavra' || !TIPOS.has(atual().valor)) {
        throw erro('todo parametro precisa de um tipo, como inteiro x');
      }
      const tipo = avancar().valor;
      const pnome = exigirNome('para o parametro');
      params.push({ tipo, nome: pnome });
      if (ehOp(',')) avancar();
      else if (!ehOp(')')) throw erro('esperava "," ou ")" na lista de parametros');
    }
    exigirOp(')');
    const corpo = bloco();
    return { tipo: 'Funcao', nome, retorno, params, corpo, linha };
  }

  function bloco() {
    exigirOp('{', 'para abrir o bloco');
    const itens = [];
    while (!ehOp('}')) {
      if (atual().tipo === 'fim') throw erro('faltou fechar um bloco com }');
      itens.push(comando());
    }
    exigirOp('}');
    return { tipo: 'Bloco', itens };
  }

  /* ------------------------------------------------------- comandos */

  function comando() {
    const s = atual();

    if (s.tipo === 'palavra') {
      switch (s.valor) {
        case 'se': return comandoSe();
        case 'enquanto': return comandoEnquanto();
        case 'para': return comandoPara();
        case 'faca': return comandoFacaEnquanto();
        case 'retorne': return comandoRetorne();
        case 'pare': avancar(); pontoEVirgulaOpcional(); return { tipo: 'Pare', linha: s.linha };
        case 'const': return declaracao();
        default:
          if (TIPOS.has(s.valor)) return declaracao();
      }
      throw erro('nao esperava a palavra "' + s.valor + '" aqui');
    }

    if (ehOp('{')) return bloco();

    return comandoExpressao();
  }

  function pontoEVirgulaOpcional() {
    if (ehOp(';')) avancar();
  }

  function declaracao() {
    let constante = false;
    if (ehPalavra('const')) { constante = true; avancar(); }
    const linha = atual().linha;
    const tipo = avancar().valor;
    const nomes = [];
    do {
      const nome = exigirNome('para a variavel');
      const dimensoes = [];
      while (ehOp('[')) {
        avancar();
        dimensoes.push(ehOp(']') ? null : expressao());
        exigirOp(']', 'para fechar o tamanho do vetor');
      }
      let inicial = null;
      if (ehOp('=')) { avancar(); inicial = ehOp('{') ? listaValores() : expressao(); }
      nomes.push({ nome, dimensoes, inicial });
      if (ehOp(',')) { avancar(); continue; }
      break;
    } while (true);
    pontoEVirgulaOpcional();
    return { tipo: 'Declaracao', tipoDado: tipo, constante, nomes, linha };
  }

  function listaValores() {
    exigirOp('{');
    const itens = [];
    while (!ehOp('}')) {
      itens.push(ehOp('{') ? listaValores() : expressao());
      if (ehOp(',')) avancar();
    }
    exigirOp('}');
    return { tipo: 'Lista', itens };
  }

  function comandoSe() {
    const linha = avancar().linha;
    exigirOp('(', 'depois de se');
    const condicao = expressao();
    exigirOp(')', 'para fechar a condicao');
    const entao = ehOp('{') ? bloco() : comando();
    let senao = null;
    if (ehPalavra('senao')) {
      avancar();
      senao = ehPalavra('se') ? comandoSe() : (ehOp('{') ? bloco() : comando());
    }
    return { tipo: 'Se', condicao, entao, senao, linha };
  }

  function comandoEnquanto() {
    const linha = avancar().linha;
    exigirOp('(', 'depois de enquanto');
    const condicao = expressao();
    exigirOp(')', 'para fechar a condicao');
    const corpo = ehOp('{') ? bloco() : comando();
    return { tipo: 'Enquanto', condicao, corpo, linha };
  }

  function comandoFacaEnquanto() {
    const linha = avancar().linha;
    const corpo = bloco();
    exigirPalavra('enquanto');
    exigirOp('(');
    const condicao = expressao();
    exigirOp(')');
    pontoEVirgulaOpcional();
    return { tipo: 'FacaEnquanto', corpo, condicao, linha };
  }

  function comandoPara() {
    const linha = avancar().linha;
    exigirOp('(', 'depois de para');
    let inicio = null;
    if (!ehOp(';')) {
      inicio = (atual().tipo === 'palavra' && TIPOS.has(atual().valor))
        ? declaracao()
        : comandoExpressao();
    } else avancar();
    let condicao = null;
    if (!ehOp(';')) condicao = expressao();
    exigirOp(';', 'entre a condicao e o incremento do para');
    let incremento = null;
    if (!ehOp(')')) incremento = expressaoOuAtribuicao();
    exigirOp(')', 'para fechar o cabecalho do para');
    const corpo = ehOp('{') ? bloco() : comando();
    return { tipo: 'Para', inicio, condicao, incremento, corpo, linha };
  }

  function comandoRetorne() {
    const linha = avancar().linha;
    let valor = null;
    if (!ehOp(';') && !ehOp('}')) valor = expressao();
    pontoEVirgulaOpcional();
    return { tipo: 'Retorne', valor, linha };
  }

  function comandoExpressao() {
    const no = expressaoOuAtribuicao();
    pontoEVirgulaOpcional();
    return no;
  }

  function expressaoOuAtribuicao() {
    const linha = atual().linha;
    const alvo = expressao();

    if (atual().tipo === 'op' && ['=', '+=', '-=', '*=', '/='].includes(atual().valor)) {
      const op = avancar().valor;
      if (alvo.tipo !== 'Variavel' && alvo.tipo !== 'Indice') {
        throw new ErroSintaxe('so da para atribuir valor a uma variavel', linha, 1);
      }
      const valor = expressao();
      return { tipo: 'Atribuicao', alvo, op, valor, linha };
    }

    if (atual().tipo === 'op' && ['++', '--'].includes(atual().valor)) {
      const op = avancar().valor;
      return { tipo: 'Passo', alvo, op, linha };
    }

    return { tipo: 'ComandoExpressao', expressao: alvo, linha };
  }

  /* ----------------------------------------------------- expressoes */

  function expressao(minima = 0) {
    let esquerda = unario();
    while (true) {
      const s = atual();
      const chave = s.tipo === 'palavra' ? s.valor : (s.tipo === 'op' ? s.valor : null);
      const prec = PRECEDENCIA[chave];
      if (prec === undefined || prec < minima) break;
      avancar();
      const direita = expressao(prec + 1);
      esquerda = { tipo: 'Binario', op: chave, esquerda, direita, linha: s.linha };
    }
    return esquerda;
  }

  function unario() {
    const s = atual();
    if (ehOp('-') || ehOp('!') || ehPalavra('nao')) {
      const op = avancar().valor;
      return { tipo: 'Unario', op: op === '!' ? 'nao' : op, valor: unario(), linha: s.linha };
    }
    if (ehOp('+')) { avancar(); return unario(); }
    if (ehOp('++') || ehOp('--')) {
      const op = avancar().valor;
      const alvo = unario();
      return { tipo: 'PassoPrefixo', op, alvo, linha: s.linha };
    }
    return posfixo();
  }

  function posfixo() {
    let no = primario();
    while (true) {
      if (ehOp('[')) {
        avancar();
        const indice = expressao();
        exigirOp(']', 'para fechar o indice');
        no = { tipo: 'Indice', base: no, indice, linha: no.linha };
        continue;
      }
      if (ehOp('.')) {
        avancar();
        // Nomes de biblioteca podem coincidir com palavras da linguagem,
        // como em pixel.vazio(cor). Por isso aceitamos os dois casos.
        if (atual().tipo !== 'nome' && atual().tipo !== 'palavra') {
          throw erro('esperava o nome de um comando depois do ponto');
        }
        const membro = avancar().valor;
        no = { tipo: 'Membro', base: no, membro, linha: no.linha };
        continue;
      }
      if (ehOp('(')) {
        avancar();
        const args = [];
        while (!ehOp(')')) {
          args.push(expressao());
          if (ehOp(',')) avancar();
          else if (!ehOp(')')) throw erro('esperava "," ou ")" entre os parametros');
        }
        exigirOp(')');
        no = { tipo: 'Chamada', alvo: no, args, linha: no.linha };
        continue;
      }
      break;
    }
    return no;
  }

  function primario() {
    const s = atual();
    if (s.tipo === 'inteiro' || s.tipo === 'real') { avancar(); return { tipo: 'Numero', valor: s.valor, linha: s.linha }; }
    if (s.tipo === 'cadeia') { avancar(); return { tipo: 'Texto', valor: s.valor, linha: s.linha }; }
    if (s.tipo === 'caracter') { avancar(); return { tipo: 'Caractere', valor: s.valor, linha: s.linha }; }
    if (ehPalavra('verdadeiro')) { avancar(); return { tipo: 'Logico', valor: true, linha: s.linha }; }
    if (ehPalavra('falso')) { avancar(); return { tipo: 'Logico', valor: false, linha: s.linha }; }
    if (s.tipo === 'nome') { avancar(); return { tipo: 'Variavel', nome: s.valor, linha: s.linha }; }
    if (ehOp('(')) {
      avancar();
      const dentro = expressao();
      exigirOp(')', 'para fechar o parenteses');
      return dentro;
    }
    throw erro('nao entendi "' + descrever(s) + '" nesta expressao');
  }

  return programa();
}

function descrever(s) {
  if (!s) return 'fim do arquivo';
  if (s.tipo === 'fim') return 'fim do arquivo';
  return String(s.valor);
}

/* Conta os nos da arvore, sem os blocos. Serve de medida do tamanho do
   codigo em Portugol, comparavel a contagem de blocos do Blockly. */
export function contarInstrucoes(no) {
  if (!no || typeof no !== 'object') return 0;
  let total = (no.tipo && no.tipo !== 'Bloco' && no.tipo !== 'Programa' && no.tipo !== 'ComandoExpressao') ? 1 : 0;
  for (const chave of Object.keys(no)) {
    if (chave === 'tipo' || chave === 'linha') continue;
    const valor = no[chave];
    if (Array.isArray(valor)) for (const v of valor) total += contarInstrucoes(v);
    else if (valor && typeof valor === 'object') total += contarInstrucoes(valor);
  }
  return total;
}
