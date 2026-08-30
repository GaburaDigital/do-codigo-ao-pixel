/* =========================================================================
   definicoes.js — Blocos proprios da biblioteca "pixel" e seus geradores.
   Depende do Blockly carregado como script global (vendor/blockly).
   ========================================================================= */

export const CORES_PADRAO = [
  ['#3BFF9E', 'verde'], ['#4DE1FF', 'ciano'], ['#F0F2F0', 'branco'],
  ['#C9CFC9', 'cinza'], ['#7C857C', 'chumbo'], ['#FFD75E', 'ambar'],
  ['#FF9E4D', 'laranja'], ['#FF6FD1', 'magenta'], ['#B07CFF', 'violeta'],
  ['#5A8CFF', 'azul'], ['#FF5C5C', 'vermelho'], ['#1F9E63', 'esmeralda'],
  ['#2FBFA8', 'turquesa'], ['#E8D3A0', 'areia'], ['#FFB3C7', 'rosa'],
  ['#A9B4C2', 'prata'],
];

/* Paleta viva: as cores da arte atual entram na frente da lista. */
let paletaAtual = CORES_PADRAO.slice();

export function definirPaletaDaArte(hexDaArte = []) {
  const daArte = hexDaArte
    .filter((c) => c && c !== 'transparente')
    .map((c) => {
      const conhecida = CORES_PADRAO.find((p) => p[0].toUpperCase() === c.toUpperCase());
      return [c.toUpperCase(), conhecida ? conhecida[1] + ' (nesta arte)' : 'cor desta arte'];
    });
  const resto = CORES_PADRAO.filter(
    (p) => !daArte.some((d) => d[0] === p[0].toUpperCase())
  );
  paletaAtual = [...daArte, ...resto];
}

export function paletaCorrente() {
  return paletaAtual;
}

function amostraSvg(hex) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="18">' +
    '<rect width="30" height="18" fill="' + hex + '" stroke="#0A0E0B"/></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function opcoesDeCor() {
  return paletaAtual.map(([hex, nome]) => [
    { src: amostraSvg(hex), width: 30, height: 18, alt: nome },
    hex,
  ]);
}

function hexParaLista(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/* ------------------------------------------------------------- cores UI */
export const COR_MOVIMENTO = '#3E7BC6';
export const COR_PINTURA = '#2E9E63';
export const COR_COR = '#B563C6';
export const COR_CONTROLE = '#C99A2E';
export const COR_OPERADOR = '#2E9E8C';
export const COR_VARIAVEL = '#C6603E';
export const COR_PROCEDIMENTO = '#7B62C6';

/* ============================================================== registro */

export function registrarBlocos(Blockly) {
  Blockly.defineBlocksWithJsonArray([
    /* ---------------------------------------------------- movimento */
    {
      type: 'pixel_mover_x',
      message0: 'mover em x %1',
      args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],
      previousStatement: null, nextStatement: null,
      colour: COR_MOVIMENTO,
      tooltip: 'Anda com o cursor na horizontal. 1 vai para a direita, -1 para a esquerda.',
    },
    {
      type: 'pixel_mover_y',
      message0: 'mover em y %1',
      args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],
      previousStatement: null, nextStatement: null,
      colour: COR_MOVIMENTO,
      tooltip: 'Anda com o cursor na vertical. 1 sobe, -1 desce.',
    },
    {
      type: 'pixel_ir_para',
      message0: 'ir para x %1 y %2',
      args0: [
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' },
      ],
      inputsInline: true,
      previousStatement: null, nextStatement: null,
      colour: COR_MOVIMENTO,
      tooltip: 'Salta direto para uma posicao do grid.',
    },
    {
      type: 'pixel_ir_para_x',
      message0: 'ir para x %1',
      args0: [{ type: 'input_value', name: 'X', check: 'Number' }],
      previousStatement: null, nextStatement: null,
      colour: COR_MOVIMENTO,
    },
    {
      type: 'pixel_ir_para_y',
      message0: 'ir para y %1',
      args0: [{ type: 'input_value', name: 'Y', check: 'Number' }],
      previousStatement: null, nextStatement: null,
      colour: COR_MOVIMENTO,
    },
    {
      type: 'pixel_posicao_x',
      message0: 'posicao x',
      output: 'Number',
      colour: COR_MOVIMENTO,
      tooltip: 'Onde o cursor esta na horizontal.',
    },
    {
      type: 'pixel_posicao_y',
      message0: 'posicao y',
      output: 'Number',
      colour: COR_MOVIMENTO,
      tooltip: 'Onde o cursor esta na vertical.',
    },
    {
      type: 'pixel_largura',
      message0: 'largura do grid',
      output: 'Number',
      colour: COR_MOVIMENTO,
      tooltip: 'Serve para o mesmo codigo funcionar em 32, 64 e 128.',
    },
    {
      type: 'pixel_altura',
      message0: 'altura do grid',
      output: 'Number',
      colour: COR_MOVIMENTO,
    },

    /* ------------------------------------------------------ pintura */
    {
      type: 'pixel_pintar',
      message0: 'pintar com %1',
      args0: [{ type: 'input_value', name: 'COR', check: 'Cor' }],
      previousStatement: null, nextStatement: null,
      colour: COR_PINTURA,
      tooltip: 'Pinta o pixel onde o cursor esta.',
    },
    {
      type: 'pixel_apagar',
      message0: 'apagar pixel',
      previousStatement: null, nextStatement: null,
      colour: COR_PINTURA,
      tooltip: 'Deixa o pixel transparente de novo.',
    },
    {
      type: 'pixel_pegar_cor',
      message0: 'cor em x %1 y %2',
      args0: [
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Cor',
      colour: COR_PINTURA,
      tooltip: 'Le a cor que voce ja pintou naquela posicao.',
    },

    /* --------------------------------------------------------- cor */
    {
      type: 'pixel_cor',
      message0: '%1',
      args0: [{ type: 'field_dropdown', name: 'COR', options: opcoesDeCor }],
      output: 'Cor',
      colour: COR_COR,
      tooltip: 'Escolhe uma cor da paleta.',
    },
    {
      type: 'pixel_cor_rgb',
      message0: 'cor R %1 G %2 B %3',
      args0: [
        { type: 'input_value', name: 'R', check: 'Number' },
        { type: 'input_value', name: 'G', check: 'Number' },
        { type: 'input_value', name: 'B', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Cor',
      colour: COR_COR,
      tooltip: 'Monta uma cor com tres numeros de 0 a 255.',
    },
    {
      type: 'pixel_componente',
      message0: '%1 de %2',
      args0: [
        {
          type: 'field_dropdown', name: 'CANAL',
          options: [['vermelho', 'VERMELHO'], ['verde', 'VERDE'], ['azul', 'AZUL']],
        },
        { type: 'input_value', name: 'COR', check: 'Cor' },
      ],
      inputsInline: true,
      output: 'Number',
      colour: COR_COR,
    },
    {
      type: 'pixel_cores_iguais',
      message0: '%1 e igual a %2',
      args0: [
        { type: 'input_value', name: 'A', check: 'Cor' },
        { type: 'input_value', name: 'B', check: 'Cor' },
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: COR_COR,
      tooltip: 'Compara duas cores.',
    },
    {
      type: 'pixel_esta_vazio',
      message0: '%1 esta vazio',
      args0: [{ type: 'input_value', name: 'COR', check: 'Cor' }],
      output: 'Boolean',
      colour: COR_COR,
      tooltip: 'Verdadeiro quando o pixel ainda nao foi pintado.',
    },
  ]);
}

/* ============================================================ geradores */

export function registrarGeradores(gerador, Order) {
  const F = gerador.forBlock;
  const num = (bloco, nome, padrao = '0') =>
    gerador.valueToCode(bloco, nome, Order.NONE) || padrao;

  F['pixel_mover_x'] = (b) => 'P.moverX(' + num(b, 'NUM', '1') + ');\n';
  F['pixel_mover_y'] = (b) => 'P.moverY(' + num(b, 'NUM', '1') + ');\n';
  F['pixel_ir_para'] = (b) => 'P.irPara(' + num(b, 'X') + ', ' + num(b, 'Y') + ');\n';
  F['pixel_ir_para_x'] = (b) => 'P.irParaX(' + num(b, 'X') + ');\n';
  F['pixel_ir_para_y'] = (b) => 'P.irParaY(' + num(b, 'Y') + ');\n';
  F['pixel_posicao_x'] = () => ['P.posicaoX()', Order.FUNCTION_CALL];
  F['pixel_posicao_y'] = () => ['P.posicaoY()', Order.FUNCTION_CALL];
  F['pixel_largura'] = () => ['P.largura()', Order.FUNCTION_CALL];
  F['pixel_altura'] = () => ['P.altura()', Order.FUNCTION_CALL];

  F['pixel_pintar'] = (b) =>
    'P.pintar(' + (gerador.valueToCode(b, 'COR', Order.NONE) || '[0,0,0]') + ');\n';
  F['pixel_apagar'] = () => 'P.apagar();\n';
  F['pixel_pegar_cor'] = (b) =>
    ['P.pegarCor(' + num(b, 'X') + ', ' + num(b, 'Y') + ')', Order.FUNCTION_CALL];

  F['pixel_cor'] = (b) => {
    const lista = hexParaLista(b.getFieldValue('COR') || '#000000');
    return ['[' + lista.join(',') + ']', Order.ATOMIC];
  };
  F['pixel_cor_rgb'] = (b) =>
    ['P.corRgb(' + num(b, 'R') + ', ' + num(b, 'G') + ', ' + num(b, 'B') + ')',
      Order.FUNCTION_CALL];
  F['pixel_componente'] = (b) =>
    ['P.componente(' + (gerador.valueToCode(b, 'COR', Order.NONE) || '[0,0,0]') +
      ', "' + b.getFieldValue('CANAL') + '")', Order.FUNCTION_CALL];
  F['pixel_cores_iguais'] = (b) =>
    ['P.corIgual(' + (gerador.valueToCode(b, 'A', Order.NONE) || '[0,0,0]') + ', ' +
      (gerador.valueToCode(b, 'B', Order.NONE) || '[0,0,0]') + ')', Order.FUNCTION_CALL];
  F['pixel_esta_vazio'] = (b) =>
    ['P.ehTransparente(' + (gerador.valueToCode(b, 'COR', Order.NONE) || '[0,0,0]') + ')',
      Order.FUNCTION_CALL];
}
