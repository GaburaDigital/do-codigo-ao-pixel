/* =========================================================================
   oficina.js — Monta o espaco de trabalho de blocos.
   Usa o renderizador "zelos" do proprio Blockly, que ja tem o formato
   arredondado do Scratch 3, com um tema ajustado para a nave.
   ========================================================================= */

import {
  registrarBlocos, registrarGeradores, definirPaletaDaArte,
  COR_MOVIMENTO, COR_PINTURA, COR_COR, COR_CONTROLE, COR_OPERADOR,
  COR_VARIAVEL, COR_PROCEDIMENTO,
} from './definicoes.js';

const BLOCOS_DE_REPETICAO = [
  'controls_repeat_ext', 'controls_repeat', 'controls_for',
  'controls_whileUntil', 'controls_forEach',
];

let workspace = null;
let Blockly = null;
let gerador = null;
let Order = null;

/* ---------------------------------------------------------------- tema */

function construirTema() {
  const escuro = document.documentElement.getAttribute('data-tema') !== 'claro';
  const estilo = getComputedStyle(document.documentElement);
  const v = (nome, alt) => (estilo.getPropertyValue(nome).trim() || alt);

  return Blockly.Theme.defineTheme('nave' + (escuro ? 'Escura' : 'Clara'), {
    base: Blockly.Themes.Zelos,
    fontStyle: { family: 'ui-monospace, Menlo, Consolas, monospace', size: 11 },
    componentStyles: {
      workspaceBackgroundColour: v('--painel-fundo', '#03060A'),
      toolboxBackgroundColour: v('--painel-alto', '#121812'),
      toolboxForegroundColour: v('--texto', '#E6EDE7'),
      flyoutBackgroundColour: v('--painel', '#0A0E0B'),
      flyoutForegroundColour: v('--texto-suave', '#93A195'),
      flyoutOpacity: 1,
      scrollbarColour: v('--linha-forte', '#435145'),
      scrollbarOpacity: 0.7,
      insertionMarkerColour: v('--verde', '#3BFF9E'),
      insertionMarkerOpacity: 0.5,
      cursorColour: v('--verde', '#3BFF9E'),
      selectedGlowColour: v('--verde', '#3BFF9E'),
      selectedGlowOpacity: 0.6,
    },
    categoryStyles: {
      movimento: { colour: COR_MOVIMENTO },
      pintura: { colour: COR_PINTURA },
      cor: { colour: COR_COR },
      controle: { colour: COR_CONTROLE },
      operador: { colour: COR_OPERADOR },
      variavel: { colour: COR_VARIAVEL },
      procedimento: { colour: COR_PROCEDIMENTO },
    },
    blockStyles: {
      logic_blocks: { colourPrimary: COR_OPERADOR },
      loop_blocks: { colourPrimary: COR_CONTROLE },
      math_blocks: { colourPrimary: COR_OPERADOR },
      text_blocks: { colourPrimary: COR_OPERADOR },
      variable_blocks: { colourPrimary: COR_VARIAVEL },
      procedure_blocks: { colourPrimary: COR_PROCEDIMENTO },
    },
  });
}

/* ------------------------------------------------------------- toolbox */

const sombraNumero = (n) => ({
  shadow: { type: 'math_number', fields: { NUM: n } },
});

function construirToolbox() {
  return {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category', name: 'Movimento', categorystyle: 'movimento',
        contents: [
          { kind: 'block', type: 'pixel_mover_x', inputs: { NUM: sombraNumero(1) } },
          { kind: 'block', type: 'pixel_mover_y', inputs: { NUM: sombraNumero(1) } },
          {
            kind: 'block', type: 'pixel_ir_para',
            inputs: { X: sombraNumero(0), Y: sombraNumero(0) },
          },
          { kind: 'block', type: 'pixel_ir_para_x', inputs: { X: sombraNumero(0) } },
          { kind: 'block', type: 'pixel_ir_para_y', inputs: { Y: sombraNumero(0) } },
          { kind: 'block', type: 'pixel_posicao_x' },
          { kind: 'block', type: 'pixel_posicao_y' },
          { kind: 'block', type: 'pixel_largura' },
          { kind: 'block', type: 'pixel_altura' },
        ],
      },
      {
        kind: 'category', name: 'Pintura', categorystyle: 'pintura',
        contents: [
          {
            kind: 'block', type: 'pixel_pintar',
            inputs: { COR: { shadow: { type: 'pixel_cor' } } },
          },
          { kind: 'block', type: 'pixel_apagar' },
          {
            kind: 'block', type: 'pixel_pegar_cor',
            inputs: { X: sombraNumero(0), Y: sombraNumero(0) },
          },
        ],
      },
      {
        kind: 'category', name: 'Cor', categorystyle: 'cor',
        contents: [
          { kind: 'block', type: 'pixel_cor' },
          {
            kind: 'block', type: 'pixel_cor_rgb',
            inputs: { R: sombraNumero(59), G: sombraNumero(255), B: sombraNumero(158) },
          },
          {
            kind: 'block', type: 'pixel_componente',
            inputs: { COR: { shadow: { type: 'pixel_cor' } } },
          },
          {
            kind: 'block', type: 'pixel_cores_iguais',
            inputs: {
              A: { shadow: { type: 'pixel_cor' } },
              B: { shadow: { type: 'pixel_cor' } },
            },
          },
          {
            kind: 'block', type: 'pixel_esta_vazio',
            inputs: { COR: { shadow: { type: 'pixel_cor' } } },
          },
        ],
      },
      {
        kind: 'category', name: 'Controle', categorystyle: 'controle',
        contents: [
          { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: sombraNumero(10) } },
          {
            kind: 'block', type: 'controls_for',
            fields: { VAR: { name: 'i' } },
            inputs: { FROM: sombraNumero(0), TO: sombraNumero(31), BY: sombraNumero(1) },
          },
          { kind: 'block', type: 'controls_whileUntil' },
          { kind: 'block', type: 'controls_if' },
          { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
          { kind: 'block', type: 'controls_flow_statements' },
        ],
      },
      {
        kind: 'category', name: 'Operadores', categorystyle: 'operador',
        contents: [
          { kind: 'block', type: 'math_number', fields: { NUM: 0 } },
          {
            kind: 'block', type: 'math_arithmetic',
            inputs: { A: sombraNumero(1), B: sombraNumero(1) },
          },
          {
            kind: 'block', type: 'math_modulo',
            inputs: { DIVIDEND: sombraNumero(4), DIVISOR: sombraNumero(2) },
          },
          {
            kind: 'block', type: 'math_single',
            inputs: { NUM: sombraNumero(9) },
          },
          {
            kind: 'block', type: 'math_round',
            inputs: { NUM: sombraNumero(3.1) },
          },
          {
            kind: 'block', type: 'logic_compare',
            inputs: { A: sombraNumero(0), B: sombraNumero(0) },
          },
          { kind: 'block', type: 'logic_operation' },
          { kind: 'block', type: 'logic_negate' },
          { kind: 'block', type: 'logic_boolean' },
        ],
      },
      { kind: 'category', name: 'Variaveis', categorystyle: 'variavel', custom: 'VARIABLE' },
      { kind: 'category', name: 'Procedimentos', categorystyle: 'procedimento', custom: 'PROCEDURE' },
    ],
  };
}

/* ------------------------------------------------------------- criacao */

export function criarOficina(divId) {
  Blockly = window.Blockly;
  gerador = Blockly.JavaScript;
  Order = window.javascript.Order;

  registrarBlocos(Blockly);
  registrarGeradores(gerador, Order);
  gerador.INFINITE_LOOP_TRAP = 'P.passo();\n';

  workspace = Blockly.inject(divId, {
    toolbox: construirToolbox(),
    theme: construirTema(),
    renderer: 'zelos',
    zoom: { controls: true, wheel: true, startScale: 0.85, minScale: 0.4, maxScale: 1.6 },
    grid: { spacing: 24, length: 2, colour: 'rgba(140,160,145,0.18)', snap: false },
    trashcan: true,
    move: { scrollbars: true, drag: true, wheel: true },
    sounds: false,
    media: 'vendor/blockly/media/',
  });
  return workspace;
}

export function obterWorkspace() {
  return workspace;
}

export function atualizarTema() {
  if (!workspace) return;
  workspace.setTheme(construirTema());
}

export function redimensionar() {
  if (!workspace) return;
  Blockly.svgResize(workspace);
}

export function limparBlocos() {
  if (workspace) workspace.clear();
}

export function paletaDaArte(hexes) {
  definirPaletaDaArte(hexes);
  if (workspace) workspace.refreshToolboxSelection();
}

/* ------------------------------------------------------- codigo e metricas */

export function gerarCodigo() {
  if (!workspace) return '';
  return gerador.workspaceToCode(workspace);
}

function ehRepeticao(bloco) {
  return BLOCOS_DE_REPETICAO.includes(bloco.type);
}

export function metricas() {
  if (!workspace) return { blocos: 0, usouRepeticao: false, pintarSolto: false, usouProcedimento: false };
  const todos = workspace.getAllBlocks(false).filter((b) => !b.isShadow() && b.isEnabled());
  let usouRepeticao = false;
  let pintarSolto = false;
  let usouProcedimento = false;

  for (const b of todos) {
    if (ehRepeticao(b)) usouRepeticao = true;
    if (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn') usouProcedimento = true;
    if (b.type === 'pixel_pintar') {
      let pai = b.getSurroundParent();
      let dentro = false;
      while (pai) {
        if (ehRepeticao(pai)) { dentro = true; break; }
        pai = pai.getSurroundParent();
      }
      if (!dentro) pintarSolto = true;
    }
  }
  return { blocos: todos.length, usouRepeticao, pintarSolto, usouProcedimento };
}

/* Salva e recupera o desenho de blocos (usado ao trocar de aba). */
export function serializar() {
  if (!workspace) return null;
  return Blockly.serialization.workspaces.save(workspace);
}

export function restaurar(estado) {
  if (!workspace || !estado) return;
  Blockly.serialization.workspaces.load(estado, workspace);
}
