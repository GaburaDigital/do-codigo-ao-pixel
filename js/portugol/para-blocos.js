/* =========================================================================
   para-blocos.js — Converte a arvore do Portugol num espaco de trabalho do
   Blockly. E o que permite escrever um exercicio uma vez so e ter as duas
   linguagens sempre iguais.

   Cobre o subconjunto usado nos exercicios: repeticoes, condicoes,
   procedimentos, variaveis, operadores e a biblioteca pixel.
   ========================================================================= */

import { analisarPrograma } from './parser.js';

const CHAMADAS_COMANDO = {
  mover_x: ['pixel_mover_x', ['NUM']],
  mover_y: ['pixel_mover_y', ['NUM']],
  ir_para: ['pixel_ir_para', ['X', 'Y']],
  ir_para_x: ['pixel_ir_para_x', ['X']],
  ir_para_y: ['pixel_ir_para_y', ['Y']],
  apagar: ['pixel_apagar', []],
};

const CHAMADAS_VALOR = {
  posicao_x: ['pixel_posicao_x', []],
  posicao_y: ['pixel_posicao_y', []],
  largura: ['pixel_largura', []],
  altura: ['pixel_altura', []],
  cor: ['pixel_cor_rgb', ['R', 'G', 'B']],
  cor_em: ['pixel_pegar_cor', ['X', 'Y']],
  iguais: ['pixel_cores_iguais', ['A', 'B']],
  vazio: ['pixel_esta_vazio', ['COR']],
  esta_vazio: ['pixel_esta_vazio', ['COR']],
};

const MATEMATICA_VALOR = {
  abs: ['math_single', 'ABS', ['NUM']],
  raiz: ['math_single', 'ROOT', ['NUM']],
  arredondar: ['math_round', 'ROUND', ['NUM']],
  piso: ['math_round', 'ROUNDDOWN', ['NUM']],
  teto: ['math_round', 'ROUNDUP', ['NUM']],
};

const ARITMETICA = { '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE' };
const COMPARACAO = { '==': 'EQ', '!=': 'NEQ', '<': 'LT', '<=': 'LTE', '>': 'GT', '>=': 'GTE' };

export class ErroConversao extends Error {}

export function portugolParaBlocos(fonte) {
  const arvore = analisarPrograma(fonte);
  return arvoreParaBlocos(arvore);
}

export function arvoreParaBlocos(arvore) {
  let contador = 0;
  const novoId = (prefixo) => prefixo + '_' + (++contador).toString(36).padStart(3, '0') + '_dcap';

  /*
    No Blockly toda variavel e do espaco de trabalho inteiro, enquanto no
    Portugol cada funcao tem as suas. Para os dois lados se comportarem igual,
    as variaveis declaradas dentro de uma funcao ganham o nome dela na frente.
  */
  const variaveis = new Map();   // chave "funcao::nome" -> { nome exibido, id }
  let escopoAtual = 'inicio';

  const idDe = (nome) => {
    const chave = escopoAtual + '::' + nome;
    if (!variaveis.has(chave)) {
      const exibido = escopoAtual === 'inicio' ? nome : escopoAtual + '_' + nome;
      variaveis.set(chave, { nome: exibido, id: novoId('v' + exibido.replace(/[^a-z0-9]/gi, '')) });
    }
    return variaveis.get(chave).id;
  };

  const numero = (n) => ({ type: 'math_number', fields: { NUM: n } });
  const sombraNumero = (n) => ({ shadow: numero(n) });

  /* ------------------------------------------------------ expressoes */

  function expr(no) {
    switch (no.tipo) {
      case 'Numero': return numero(no.valor);
      case 'Logico': return { type: 'logic_boolean', fields: { BOOL: no.valor ? 'TRUE' : 'FALSE' } };
      case 'Variavel': return { type: 'variables_get', fields: { VAR: { id: idDe(no.nome) } } };

      case 'Unario':
        if (no.op === 'nao') return { type: 'logic_negate', inputs: { BOOL: { block: expr(no.valor) } } };
        return {
          type: 'math_arithmetic',
          fields: { OP: 'MINUS' },
          inputs: { A: sombraNumero(0), B: { block: expr(no.valor) } },
        };

      case 'Binario': {
        const op = no.op;
        if (op === '%') {
          return {
            type: 'math_modulo',
            inputs: {
              DIVIDEND: { block: expr(no.esquerda) },
              DIVISOR: { block: expr(no.direita) },
            },
          };
        }
        if (ARITMETICA[op]) {
          const conta = {
            type: 'math_arithmetic',
            fields: { OP: ARITMETICA[op] },
            inputs: { A: { block: expr(no.esquerda) }, B: { block: expr(no.direita) } },
          };
          // No Portugol a divisao entre inteiros descarta a parte quebrada.
          // O bloco do Blockly divide com casas decimais, entao arredondamos
          // para baixo e os dois lados voltam a concordar.
          if (op === '/') {
            return { type: 'math_round', fields: { OP: 'ROUNDDOWN' }, inputs: { NUM: { block: conta } } };
          }
          return conta;
        }
        if (COMPARACAO[op]) {
          return {
            type: 'logic_compare',
            fields: { OP: COMPARACAO[op] },
            inputs: { A: { block: expr(no.esquerda) }, B: { block: expr(no.direita) } },
          };
        }
        if (op === 'e' || op === '&&' || op === 'ou' || op === '||') {
          return {
            type: 'logic_operation',
            fields: { OP: (op === 'e' || op === '&&') ? 'AND' : 'OR' },
            inputs: { A: { block: expr(no.esquerda) }, B: { block: expr(no.direita) } },
          };
        }
        throw new ErroConversao('operador sem bloco equivalente: ' + op);
      }

      case 'Chamada': return chamadaValor(no);

      default:
        throw new ErroConversao('expressao sem bloco equivalente: ' + no.tipo);
    }
  }

  function nomeBiblioteca(no) {
    return no.alvo.tipo === 'Membro' && no.alvo.base.tipo === 'Variavel'
      ? { lib: no.alvo.base.nome.toLowerCase(), fn: no.alvo.membro }
      : null;
  }

  function chamadaValor(no) {
    const b = nomeBiblioteca(no);
    if (b && b.lib === 'pixel') {
      const def = CHAMADAS_VALOR[b.fn];
      if (!def) throw new ErroConversao('pixel.' + b.fn + ' nao tem bloco de valor');
      const [tipo, entradas] = def;
      const inputs = {};
      entradas.forEach((nome, i) => { inputs[nome] = { block: expr(no.args[i]) }; });
      return entradas.length ? { type: tipo, inputs } : { type: tipo };
    }
    if (b && (b.lib === 'matematica' || b.lib === 'math')) {
      if (b.fn === 'potencia') {
        return {
          type: 'math_arithmetic',
          fields: { OP: 'POWER' },
          inputs: { A: { block: expr(no.args[0]) }, B: { block: expr(no.args[1]) } },
        };
      }
      const def = MATEMATICA_VALOR[b.fn];
      if (!def) throw new ErroConversao('matematica.' + b.fn + ' nao tem bloco equivalente');
      const [tipo, op, entradas] = def;
      const inputs = {};
      entradas.forEach((nome, i) => { inputs[nome] = { block: expr(no.args[i]) }; });
      return { type: tipo, fields: { OP: op }, inputs };
    }
    if (b) throw new ErroConversao('biblioteca sem bloco equivalente: ' + b.lib);

    // Chamada de funcao propria com retorno
    return {
      type: 'procedures_callreturn',
      extraState: { name: no.alvo.nome, params: paramsDe(no.alvo.nome) },
      inputs: entradasArgs(no.args),
    };
  }

  /* -------------------------------------------------------- comandos */

  const assinaturas = new Map();  // nome da funcao -> lista de parametros
  const paramsDe = (nome) => assinaturas.get(nome) || [];

  function entradasArgs(args) {
    const inputs = {};
    args.forEach((a, i) => { inputs['ARG' + i] = { block: expr(a) }; });
    return inputs;
  }

  /* Encadeia uma lista de comandos usando a propriedade next. */
  function encadear(itens) {
    const blocos = [];
    for (const item of itens) {
      const b = comando(item);
      if (Array.isArray(b)) blocos.push(...b);
      else if (b) blocos.push(b);
    }
    if (!blocos.length) return null;
    for (let i = 0; i < blocos.length - 1; i++) blocos[i].next = { block: blocos[i + 1] };
    return blocos[0];
  }

  function corpoDe(no) {
    if (!no) return null;
    if (no.tipo === 'Bloco') return encadear(no.itens);
    return comando(no);
  }

  function comando(no) {
    switch (no.tipo) {
      case 'Bloco': return encadear(no.itens);

      case 'Declaracao': {
        const saida = [];
        for (const d of no.nomes) {
          if (d.dimensoes.length) throw new ErroConversao('vetores nao tem bloco equivalente');
          saida.push({
            type: 'variables_set',
            fields: { VAR: { id: idDe(d.nome) } },
            inputs: { VALUE: { block: d.inicial ? expr(d.inicial) : numero(0) } },
          });
        }
        return saida;
      }

      case 'Atribuicao': {
        if (no.alvo.tipo !== 'Variavel') throw new ErroConversao('atribuicao a vetor nao tem bloco');
        if (no.op === '=') {
          return {
            type: 'variables_set',
            fields: { VAR: { id: idDe(no.alvo.nome) } },
            inputs: { VALUE: { block: expr(no.valor) } },
          };
        }
        const sinal = no.op === '-=' ? -1 : 1;
        if (no.op === '+=' || no.op === '-=') {
          const valor = no.valor.tipo === 'Numero'
            ? numero(no.valor.valor * sinal)
            : expr(no.valor);
          return {
            type: 'math_change',
            fields: { VAR: { id: idDe(no.alvo.nome) } },
            inputs: { DELTA: { shadow: numero(1), block: valor } },
          };
        }
        throw new ErroConversao('operador de atribuicao sem bloco: ' + no.op);
      }

      case 'Passo': case 'PassoPrefixo':
        return {
          type: 'math_change',
          fields: { VAR: { id: idDe(no.alvo.nome) } },
          inputs: { DELTA: { shadow: numero(no.op === '++' ? 1 : -1) } },
        };

      case 'Se': {
        const ramos = [];
        let atual = no;
        while (atual && atual.tipo === 'Se') {
          ramos.push({ cond: atual.condicao, entao: atual.entao });
          atual = atual.senao && atual.senao.tipo === 'Se' ? atual.senao : (atual.senao ? { final: atual.senao } : null);
          if (atual && atual.final) break;
        }
        const senaoFinal = atual && atual.final ? atual.final : null;
        const bloco = {
          type: 'controls_if',
          inputs: {},
        };
        if (ramos.length > 1 || senaoFinal) {
          bloco.extraState = {};
          if (ramos.length > 1) bloco.extraState.elseIfCount = ramos.length - 1;
          if (senaoFinal) bloco.extraState.hasElse = true;
        }
        ramos.forEach((r, i) => {
          bloco.inputs['IF' + i] = { block: expr(r.cond) };
          const corpo = corpoDe(r.entao);
          if (corpo) bloco.inputs['DO' + i] = { block: corpo };
        });
        if (senaoFinal) {
          const corpo = corpoDe(senaoFinal);
          if (corpo) bloco.inputs.ELSE = { block: corpo };
        }
        return bloco;
      }

      case 'Enquanto': {
        const bloco = {
          type: 'controls_whileUntil',
          fields: { MODE: 'WHILE' },
          inputs: { BOOL: { block: expr(no.condicao) } },
        };
        const corpo = corpoDe(no.corpo);
        if (corpo) bloco.inputs.DO = { block: corpo };
        return bloco;
      }

      case 'FacaEnquanto':
        throw new ErroConversao('faca-enquanto nao tem bloco equivalente');

      case 'Para': return blocoPara(no);

      case 'ComandoExpressao': {
        const e = no.expressao;
        if (e.tipo !== 'Chamada') throw new ErroConversao('comando sem bloco equivalente');
        return chamadaComando(e);
      }

      case 'Retorne':
        throw new ErroConversao('retorne so aparece em funcao com valor');

      case 'Pare':
        return { type: 'controls_flow_statements', fields: { FLOW: 'BREAK' } };

      default:
        throw new ErroConversao('comando sem bloco equivalente: ' + no.tipo);
    }
  }

  function chamadaComando(no) {
    const b = nomeBiblioteca(no);
    if (b && b.lib === 'pixel') {
      if (b.fn === 'pintar') {
        const cor = no.args.length === 3
          ? {
            type: 'pixel_cor_rgb',
            inputs: { R: { block: expr(no.args[0]) }, G: { block: expr(no.args[1]) }, B: { block: expr(no.args[2]) } },
          }
          : expr(no.args[0]);
        return { type: 'pixel_pintar', inputs: { COR: { block: cor } } };
      }
      const def = CHAMADAS_COMANDO[b.fn];
      if (!def) throw new ErroConversao('pixel.' + b.fn + ' nao tem bloco de comando');
      const [tipo, entradas] = def;
      const inputs = {};
      entradas.forEach((nome, i) => { inputs[nome] = { block: expr(no.args[i]) }; });
      return entradas.length ? { type: tipo, inputs } : { type: tipo };
    }
    if (b) throw new ErroConversao('biblioteca sem bloco equivalente: ' + b.lib);

    return {
      type: 'procedures_callnoreturn',
      extraState: { name: no.alvo.nome, params: paramsDe(no.alvo.nome) },
      inputs: entradasArgs(no.args),
    };
  }

  /* Reconhece o "para" no formato classico e usa o bloco contar de X ate Y. */
  function blocoPara(no) {
    const init = no.inicio;
    const cond = no.condicao;
    const incr = no.incremento;

    const simples =
      init && init.tipo === 'Declaracao' && init.nomes.length === 1 && !init.nomes[0].dimensoes.length &&
      cond && cond.tipo === 'Binario' && ['<', '<=', '>', '>='].includes(cond.op) &&
      cond.esquerda.tipo === 'Variavel' && cond.esquerda.nome === init.nomes[0].nome &&
      incr && (incr.tipo === 'Passo' || (incr.tipo === 'Atribuicao' && ['+=', '-='].includes(incr.op)));

    if (simples) {
      const nome = init.nomes[0].nome;
      const de = init.nomes[0].inicial;
      let passo = 1;
      if (incr.tipo === 'Passo') passo = incr.op === '++' ? 1 : -1;
      else if (incr.valor.tipo === 'Numero') passo = incr.valor.valor * (incr.op === '-=' ? -1 : 1);
      else passo = null;

      if (passo !== null) {
        // O bloco do Blockly inclui o limite, entao ajustamos "<" e ">".
        let ate = cond.direita;
        if (cond.op === '<' || cond.op === '>') {
          ate = (cond.direita.tipo === 'Numero')
            ? { tipo: 'Numero', valor: cond.direita.valor + (cond.op === '<' ? -1 : 1), linha: no.linha }
            : {
              tipo: 'Binario',
              op: cond.op === '<' ? '-' : '+',
              esquerda: cond.direita,
              direita: { tipo: 'Numero', valor: 1, linha: no.linha },
              linha: no.linha,
            };
        }
        const bloco = {
          type: 'controls_for',
          fields: { VAR: { id: idDe(nome) } },
          inputs: {
            FROM: { shadow: numero(0), block: expr(de || { tipo: 'Numero', valor: 0 }) },
            TO: { shadow: numero(0), block: expr(ate) },
            BY: { shadow: numero(Math.abs(passo)) },
          },
        };
        const corpo = corpoDe(no.corpo);
        if (corpo) bloco.inputs.DO = { block: corpo };
        return bloco;
      }
    }

    // Formato incomum: vira uma variavel, um enquanto e o incremento no fim.
    const antes = init ? comando(init) : null;
    const corpoItens = no.corpo.tipo === 'Bloco' ? [...no.corpo.itens] : [no.corpo];
    if (no.incremento) corpoItens.push(no.incremento);
    const laco = {
      type: 'controls_whileUntil',
      fields: { MODE: 'WHILE' },
      inputs: { BOOL: { block: expr(cond) } },
    };
    const corpo = encadear(corpoItens);
    if (corpo) laco.inputs.DO = { block: corpo };
    if (!antes) return laco;
    const lista = Array.isArray(antes) ? antes : [antes];
    for (let i = 0; i < lista.length - 1; i++) lista[i].next = { block: lista[i + 1] };
    lista[lista.length - 1].next = { block: laco };
    return lista[0];
  }

  /* ---------------------------------------------------- montagem final */

  for (const f of arvore.funcoes) {
    if (f.nome === 'inicio') continue;
    assinaturas.set(f.nome, f.params.map((p) => p.nome));
  }

  const topo = [];
  let deslocamentoY = 20;

  for (const f of arvore.funcoes) {
    if (f.nome === 'inicio') continue;
    escopoAtual = f.nome;
    const params = f.params.map((p) => ({ name: f.nome + '_' + p.nome, id: idDe(p.nome) }));
    const temRetorno = f.retorno !== 'vazio';
    const bloco = {
      type: temRetorno ? 'procedures_defreturn' : 'procedures_defnoreturn',
      x: 480,
      y: deslocamentoY,
      extraState: { params },
      fields: { NAME: f.nome },
      inputs: {},
    };
    const itens = f.corpo.itens.filter((i) => i.tipo !== 'Retorne');
    const corpo = encadear(itens);
    if (corpo) bloco.inputs.STACK = { block: corpo };
    const retorne = f.corpo.itens.find((i) => i.tipo === 'Retorne');
    if (retorne && retorne.valor) bloco.inputs.RETURN = { block: expr(retorne.valor) };
    topo.push(bloco);
    deslocamentoY += 200;
  }

  escopoAtual = 'inicio';
  const inicio = arvore.funcoes.find((f) => f.nome === 'inicio');
  const principal = encadear(inicio.corpo.itens);
  if (principal) {
    principal.x = 40;
    principal.y = 20;
    topo.unshift(principal);
  }

  return {
    blocks: { languageVersion: 0, blocks: topo },
    variables: [...variaveis.values()].map(({ nome, id }) => ({ name: nome, id })),
  };
}
